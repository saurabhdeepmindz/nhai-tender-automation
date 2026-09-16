"""
Lightweight RAG chain wrapper for the NHAI system.
- Ingests text via DocumentProcessor chunking
- Generates embeddings (Ollama first, OpenAI fallback)
- Persists chunks to ChromaDB
- Performs semantic search with retrieved contexts
- Optional RAGAS evaluation hook (see ragas_evaluator.py)
"""
from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import List, Dict, Optional

from .document_processing.document_processor import DocumentProcessor
from .embeddings import EmbeddingConfig, EmbeddingGenerator, EmbeddingProvider
from .vector_db.chroma_service import ChromaService

logger = logging.getLogger(__name__)


@dataclass
class IngestDocument:
    document_id: int
    rfp_number: str
    title: str
    content: str
    metadata: Optional[Dict] = None


class RAGChain:
    """Thin orchestrator that wires processor → embeddings → vector store."""

    def __init__(
        self,
        *,
        persist_directory: str = "./chroma_db",
        embedding_provider: EmbeddingProvider = EmbeddingProvider.OLLAMA,
        embedding_model: Optional[str] = None,
        openai_api_key: Optional[str] = None,
        ollama_base_url: str = "http://localhost:11434",
        chunk_size: int = 1000,
        chunk_overlap: int = 200,
    ) -> None:
        # Embedding generator (Ollama first by default)
        self.embedding_config = EmbeddingConfig(
            provider=embedding_provider,
            model=embedding_model,
            api_key=openai_api_key,
            base_url=ollama_base_url,
            chunk_size=chunk_size,
        )
        self.embedding_generator = EmbeddingGenerator(self.embedding_config)

        # Document processor uses Ollama first by default; falls back to OpenAI
        processor_model = "ollama" if embedding_provider == EmbeddingProvider.OLLAMA else "openai"
        self.document_processor = DocumentProcessor(
            embedding_model=processor_model,
            openai_api_key=openai_api_key,
            ollama_base_url=ollama_base_url,
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
        )

        # Vector store (persistent)
        self.vector_store = ChromaService(persist_directory=persist_directory)

        logger.info(
            "RAGChain initialized (provider=%s, model=%s, persist_dir=%s)",
            embedding_provider,
            embedding_model or "default",
            persist_directory,
        )

    def index_documents(self, docs: List[IngestDocument], *, add_full_doc_preview: bool = False) -> None:
        """Chunk and index RFP-style documents into Chroma.

        Each chunk is stored via add_rfp_chunk for semantic retrieval.
        """
        for doc in docs:
            chunks = self.document_processor.text_splitter.split_text(doc.content)
            if not chunks:
                logger.warning("No chunks produced for document_id=%s", doc.document_id)
                continue

            embeddings = self.embedding_generator.embed_documents(chunks)
            for idx, (chunk, emb) in enumerate(zip(chunks, embeddings)):
                self.vector_store.add_rfp_chunk(
                    document_id=doc.document_id,
                    rfp_number=doc.rfp_number,
                    title=doc.title,
                    chunk_text=chunk,
                    chunk_index=idx,
                    embeddings=emb,
                    metadata=doc.metadata or {},
                )

            if add_full_doc_preview:
                # Store a small combined preview as a single chunk for quick recall
                preview = doc.content[:1000]
                preview_emb = self.embedding_generator.embed_query(preview)
                self.vector_store.add_rfp_chunk(
                    document_id=doc.document_id,
                    rfp_number=doc.rfp_number,
                    title=f"{doc.title} (preview)",
                    chunk_text=preview,
                    chunk_index=-1,
                    embeddings=preview_emb,
                    metadata={"is_preview": True, **(doc.metadata or {})},
                )

    def _normalize_query(self, query: str) -> str:
        import re
        # Lowercase, remove punctuation, trim whitespace
        query = query.lower()
        query = re.sub(r'[^\w\s]', '', query)
        return query.strip()

    def search(self, query: str, *, rfp_number: Optional[str] = None, top_k: int = 5, similarity_threshold: float = 0.7) -> Dict:
        """Semantic search across QA + RFP + Corrigendum collections with normalization and fallback."""
        normalized_query = self._normalize_query(query)
        query_emb = self.embedding_generator.embed_query(normalized_query)
        results = self.vector_store.semantic_search_all(
            query_embeddings=query_emb,
            rfp_number=rfp_number,
            n_results=top_k,
        )
        # Fallback: If no result above threshold, return possible matches
        possible_matches = []
        for bucket in ("qa_results", "rfp_results", "corrigendum_results"):
            for item in results.get(bucket, []):
                sim = item.get("similarity")
                if sim is not None and sim >= similarity_threshold:
                    # At least one strong match found
                    return results
                elif sim is not None:
                    possible_matches.append({"bucket": bucket, **item})
        # No strong match, return possible matches with scores
        results["possible_matches"] = sorted(possible_matches, key=lambda x: x.get("similarity", 0), reverse=True)[:top_k]
        return results

    def query_with_context(self, query: str, *, rfp_number: Optional[str] = None, top_k: int = 5) -> Dict:
        """Retrieve relevant contexts for downstream answer generation.

        Returns a dict with retrieved contexts; answer generation is left to the caller/LLM.
        """
        search_results = self.search(query, rfp_number=rfp_number, top_k=top_k)
        contexts: List[str] = []
        for bucket in ("qa_results", "rfp_results", "corrigendum_results"):
            for item in search_results.get(bucket, []):
                if "document" in item:
                    contexts.append(item["document"])
        return {
            "query": query,
            "contexts": contexts,
            "raw_results": search_results,
        }

    def evaluate_answer(self, question: str, answer: str, contexts: List[str]) -> Dict:
        """Optional RAGAS evaluation hook (uses ragas_evaluator if available)."""
        try:
            from .ragas_evaluator import RAGASEvaluator  # Lazy import
        except Exception as exc:  # pragma: no cover - optional dep
            logger.warning("RAGAS evaluator unavailable: %s", exc)
            return {"faithfulness": None, "answer_relevancy": None, "error": str(exc)}

        evaluator = RAGASEvaluator()
        # Use asyncio loop internally
        import asyncio

        return asyncio.run(evaluator.aevaluate(question=question, answer=answer, contexts=contexts))
