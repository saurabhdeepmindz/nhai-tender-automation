"""
Screen 7: History Retriever Agent - Core Implementation
NHAI AI-Driven Tender Query Automation System

This is the core RAG agent that:
1. Ingests historical RFPs, Q&A, and corrigenda
2. Creates embeddings and stores in vector database
3. Performs semantic search for Screen 8 queries
4. Provides context for AI-driven responses

Author: NHAI Development Team
Version: 1.0.0
"""

import os
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime
import asyncio

from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.embeddings import OllamaEmbeddings
from langchain_community.llms import Ollama
from langchain.schema import Document

from vector_store_manager import VectorStoreManager
from config_manager import ConfigManager

logger = logging.getLogger(__name__)

class HistoryRetrieverAgent:
    """
    5-Step Agentic RAG Workflow for Historical Data
    
    WORKFLOW:
    1. Document Ingestion → Parse and chunk documents
    2. Embedding Generation → Create vector embeddings
    3. Vector Storage → Store in ChromaDB
    4. Semantic Search → Find relevant historical data
    5. Context Retrieval → Return formatted results
    """
    
    def __init__(self, config_manager: ConfigManager):
        """
        Initialize History Retriever Agent
        
        Args:
            config_manager: Configuration manager instance
        """
        self.config = config_manager
        self.vector_store = VectorStoreManager(config_manager)
        
        # Initialize embeddings model
        self.embeddings = OllamaEmbeddings(
            model=self.config.get("embedding_model", "gemma:2b"),
            base_url=self.config.get("ollama_base_url", "http://localhost:11434")
        )
        
        # Initialize LLM for text processing
        self.llm = Ollama(
            model=self.config.get("llm_model", "llama2"),
            base_url=self.config.get("ollama_base_url", "http://localhost:11434")
        )
        
        # Initialize text splitter
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=self.config.get("chunk_size", 1000),
            chunk_overlap=self.config.get("chunk_overlap", 200),
            length_function=len,
            separators=["\n\n", "\n", ". ", " ", ""]
        )
        
        logger.info("History Retriever Agent initialized")
    
    async def initialize(self):
        """Initialize vector store and load existing data"""
        try:
            await self.vector_store.initialize()
            logger.info("Vector store initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize vector store: {str(e)}")
            raise
    
    # ========================================================================
    # STEP 1: Document Ingestion
    # ========================================================================
    
    async def ingest_document(
        self,
        document_id: str,
        content: str,
        metadata: Dict[str, Any],
        file_type: str = "txt"
    ) -> int:
        """
        Ingest a document into the knowledge base
        
        Args:
            document_id: Unique identifier for the document
            content: Document text content
            metadata: Document metadata (RFP number, type, etc.)
            file_type: File type (pdf, docx, txt, csv)
            
        Returns:
            Number of chunks created
        """
        try:
            logger.info(f"Ingesting document: {document_id}")
            
            # Step 1: Parse content based on file type
            parsed_content = await self._parse_content(content, file_type)
            
            # Step 2: Split into chunks
            chunks = await self._create_chunks(parsed_content, metadata)
            
            # Step 3: Generate embeddings
            embedded_chunks = await self._generate_embeddings(chunks)
            
            # Step 4: Store in vector database
            await self.vector_store.add_documents(
                document_id=document_id,
                chunks=embedded_chunks,
                metadata=metadata
            )
            
            logger.info(f"Successfully ingested {len(chunks)} chunks for document {document_id}")
            return len(chunks)
            
        except Exception as e:
            logger.error(f"Failed to ingest document {document_id}: {str(e)}")
            raise
    
    async def _parse_content(self, content: str, file_type: str) -> str:
        """
        Parse content based on file type
        
        Supports: PDF, DOCX, TXT, CSV
        """
        if file_type.lower() == "pdf":
            # PDF parsing (would use PyPDF2 or similar)
            return content
        elif file_type.lower() == "docx":
            # DOCX parsing (would use python-docx)
            return content
        elif file_type.lower() == "csv":
            # CSV parsing - convert Q&A pairs to structured text
            return self._parse_qa_csv(content)
        else:
            # Plain text
            return content
    
    def _parse_qa_csv(self, csv_content: str) -> str:
        """
        Parse CSV Q&A data into structured text
        
        Format: Query | Response | Category | Date
        """
        lines = csv_content.strip().split('\n')
        structured_text = []
        
        for line in lines[1:]:  # Skip header
            parts = line.split(',')
            if len(parts) >= 4:
                query, response, category, date = parts[0:4]
                structured_text.append(
                    f"Category: {category}\n"
                    f"Query: {query}\n"
                    f"Response: {response}\n"
                    f"Date: {date}\n"
                    f"---"
                )
        
        return "\n\n".join(structured_text)
    
    # ========================================================================
    # STEP 2: Chunking
    # ========================================================================
    
    async def _create_chunks(
        self,
        content: str,
        metadata: Dict[str, Any]
    ) -> List[Document]:
        """
        Split document into chunks with metadata
        
        Uses RecursiveCharacterTextSplitter with overlap
        """
        try:
            # Split text
            chunks = self.text_splitter.split_text(content)
            
            # Create Document objects with metadata
            documents = []
            for i, chunk in enumerate(chunks):
                doc_metadata = metadata.copy()
                doc_metadata.update({
                    "chunk_index": i,
                    "chunk_count": len(chunks),
                    "chunk_size": len(chunk)
                })
                
                documents.append(Document(
                    page_content=chunk,
                    metadata=doc_metadata
                ))
            
            return documents
            
        except Exception as e:
            logger.error(f"Failed to create chunks: {str(e)}")
            raise
    
    # ========================================================================
    # STEP 3: Embedding Generation
    # ========================================================================
    
    async def _generate_embeddings(self, documents: List[Document]) -> List[Dict[str, Any]]:
        """
        Generate embeddings for document chunks
        
        Uses Ollama embeddings model (gemma:2b by default)
        """
        try:
            embedded_docs = []
            
            for doc in documents:
                # Generate embedding
                embedding = await asyncio.to_thread(
                    self.embeddings.embed_query,
                    doc.page_content
                )
                
                embedded_docs.append({
                    "text": doc.page_content,
                    "embedding": embedding,
                    "metadata": doc.metadata
                })
            
            return embedded_docs
            
        except Exception as e:
            logger.error(f"Failed to generate embeddings: {str(e)}")
            raise
    
    # ========================================================================
    # STEP 4: Semantic Search
    # ========================================================================
    
    async def search(
        self,
        query: str,
        top_k: int = 5,
        filters: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """
        Perform semantic search over historical data
        
        This is the main method used by Screen 8 (Chief Engineer Agent)
        to find relevant historical context.
        
        Args:
            query: Search query text
            top_k: Number of results to return
            filters: Metadata filters (document_type, rfp_number, etc.)
            
        Returns:
            List of search results with text, score, and metadata
        """
        try:
            logger.info(f"Performing semantic search: '{query[:100]}...'")
            
            # Generate query embedding
            query_embedding = await asyncio.to_thread(
                self.embeddings.embed_query,
                query
            )
            
            # Search vector store
            results = await self.vector_store.similarity_search(
                query_embedding=query_embedding,
                top_k=top_k,
                filters=filters
            )
            
            # Apply reranking if enabled
            if self.config.get("reranking_enabled", False):
                results = await self._rerank_results(query, results)
            
            logger.info(f"Found {len(results)} results")
            return results
            
        except Exception as e:
            logger.error(f"Search failed: {str(e)}")
            raise
    
    async def _rerank_results(
        self,
        query: str,
        results: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Rerank results using LLM for better relevance
        
        Optional feature to improve result quality
        """
        try:
            # Simple reranking based on keyword overlap
            # Could be replaced with a more sophisticated model
            reranked = sorted(
                results,
                key=lambda x: self._calculate_relevance_score(query, x["text"]),
                reverse=True
            )
            
            return reranked
            
        except Exception as e:
            logger.warning(f"Reranking failed, returning original results: {str(e)}")
            return results
    
    def _calculate_relevance_score(self, query: str, text: str) -> float:
        """Calculate relevance score based on keyword overlap"""
        query_words = set(query.lower().split())
        text_words = set(text.lower().split())
        
        if not query_words:
            return 0.0
        
        overlap = len(query_words.intersection(text_words))
        return overlap / len(query_words)
    
    # ========================================================================
    # STEP 5: Context Retrieval & Formatting
    # ========================================================================
    
    async def get_context_for_query(
        self,
        query: str,
        rfp_number: Optional[str] = None,
        top_k: int = 5
    ) -> Dict[str, Any]:
        """
        Get formatted context for a query
        
        Used by Screen 8 to get historical context
        
        Returns:
            {
                "query": str,
                "relevant_rfps": List[str],
                "similar_queries": List[Dict],
                "context_chunks": List[Dict],
                "confidence_score": float
            }
        """
        try:
            # Build filters
            filters = {}
            if rfp_number:
                filters["rfp_number"] = rfp_number
            
            # Search for relevant chunks
            results = await self.search(query, top_k=top_k, filters=filters)
            
            # Extract unique RFPs
            relevant_rfps = list(set(
                r["metadata"].get("rfp_number", "Unknown")
                for r in results
            ))
            
            # Find similar Q&A pairs
            similar_queries = [
                r for r in results
                if r["metadata"].get("document_type") == "QA"
            ]
            
            # Calculate confidence score
            confidence = self._calculate_confidence(results)
            
            return {
                "query": query,
                "relevant_rfps": relevant_rfps,
                "similar_queries": similar_queries[:3],
                "context_chunks": results,
                "confidence_score": confidence,
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Failed to get context: {str(e)}")
            raise
    
    def _calculate_confidence(self, results: List[Dict[str, Any]]) -> float:
        """
        Calculate confidence score based on result quality
        
        Factors:
        - Average similarity score
        - Number of results
        - Result diversity
        """
        if not results:
            return 0.0
        
        # Average similarity score
        avg_score = sum(r["score"] for r in results) / len(results)
        
        # Bonus for having multiple high-quality results
        high_quality_count = sum(1 for r in results if r["score"] > 0.7)
        quality_bonus = min(high_quality_count * 0.1, 0.3)
        
        # Final confidence (capped at 1.0)
        confidence = min(avg_score + quality_bonus, 1.0)
        
        return round(confidence, 2)
    
    # ========================================================================
    # Document Management
    # ========================================================================
    
    async def delete_document(self, document_id: str) -> bool:
        """Delete a document from the vector store"""
        try:
            return await self.vector_store.delete_document(document_id)
        except Exception as e:
            logger.error(f"Failed to delete document {document_id}: {str(e)}")
            return False
    
    async def list_documents(
        self,
        skip: int = 0,
        limit: int = 100,
        document_type: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """List all documents in the vector store"""
        try:
            return await self.vector_store.list_documents(skip, limit, document_type)
        except Exception as e:
            logger.error(f"Failed to list documents: {str(e)}")
            return []
    
    async def get_statistics(self) -> Dict[str, Any]:
        """Get vector store statistics"""
        try:
            return await self.vector_store.get_stats()
        except Exception as e:
            logger.error(f"Failed to get statistics: {str(e)}")
            return {}
    
    async def check_vector_store_health(self) -> str:
        """Check vector store health"""
        try:
            stats = await self.get_statistics()
            if stats and stats.get("total_documents", 0) >= 0:
                return "healthy"
            return "unhealthy"
        except:
            return "error"
    
    async def reindex_all_documents(self):
        """Reindex all documents (background task)"""
        try:
            logger.info("Starting reindexing...")
            await self.vector_store.reindex_all()
            logger.info("Reindexing completed")
        except Exception as e:
            logger.error(f"Reindexing failed: {str(e)}")
    
    async def cleanup(self):
        """Cleanup resources"""
        try:
            await self.vector_store.close()
            logger.info("History Retriever Agent cleaned up")
        except Exception as e:
            logger.error(f"Cleanup failed: {str(e)}")
