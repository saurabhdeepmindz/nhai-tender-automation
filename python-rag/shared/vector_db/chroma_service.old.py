# rag_service/vector_db/chroma_service.py

import chromadb
from chromadb.config import Settings
from typing import List, Dict, Optional
import uuid
import logging

logger = logging.getLogger(__name__)


class ChromaService:
    """
    ChromaDB service for storing and retrieving document embeddings
    Used for semantic search in Pre-bid Query Management (Screen 07)
    """

    def __init__(self, persist_directory: str = "./chroma_db"):
        """Initialize ChromaDB client with persistent storage"""
        self.client = chromadb.Client(
            Settings(
                chroma_db_impl="duckdb+parquet",
                persist_directory=persist_directory,
                anonymized_telemetry=False
            )
        )

        # Create collections for each document type
        self.rfp_collection = self.client.get_or_create_collection(
            name="rfp_documents",
            metadata={"description": "RFP documents and content"},
            embedding_function=None  # We'll provide embeddings ourselves
        )

        self.qa_collection = self.client.get_or_create_collection(
            name="qa_documents",
            metadata={"description": "Pre-bid Q&A pairs for semantic search"},
            embedding_function=None
        )

        self.corrigendum_collection = self.client.get_or_create_collection(
            name="corrigendum_documents",
            metadata={"description": "Corrigendum documents"},
            embedding_function=None
        )

        logger.info("ChromaDB initialized successfully")

    def add_rfp_document(
        self,
        document_id: int,
        rfp_number: str,
        title: str,
        content: str,
        embeddings: List[float],
        metadata: Dict = None
    ) -> str:
        """
        Add RFP document to vector database

        Args:
            document_id: Unique document ID from PostgreSQL
            rfp_number: RFP identification number
            title: Document title
            content: Extracted text content
            embeddings: Vector embeddings
            metadata: Additional metadata

        Returns:
            str: ChromaDB ID
        """
        chroma_id = f"rfp_{document_id}"

        self.rfp_collection.add(
            ids=[chroma_id],
            embeddings=[embeddings],
            documents=[content[:1000]],  # Store first 1000 chars as preview
            metadatas=[{
                "document_id": str(document_id),
                "rfp_number": rfp_number,
                "title": title,
                "type": "RFP",
                "year": self._extract_year(rfp_number),
                **(metadata or {})
            }]
        )

        logger.info(f"Added RFP document to ChromaDB: {chroma_id}")
        return chroma_id

    def add_qa_pair(
        self,
        document_id: int,
        rfp_number: str,
        query: str,
        response: str,
        query_embeddings: List[float],
        category: str = "General",
        metadata: Dict = None
    ) -> str:
        """
        Add Q&A pair to vector database for semantic search

        Args:
            document_id: Unique document ID from PostgreSQL
            rfp_number: RFP identification number
            query: Original query text
            response: Response text
            query_embeddings: Vector embeddings for the query
            category: Query category
            metadata: Additional metadata

        Returns:
            str: ChromaDB ID
        """
        # Generate unique ID for this Q&A pair
        qa_id = f"qa_{document_id}_{uuid.uuid4().hex[:8]}"

        # Combine query and response for context
        combined_text = f"Query: {query}\n\nResponse: {response}"

        self.qa_collection.add(
            ids=[qa_id],
            embeddings=[query_embeddings],
            documents=[combined_text],
            metadatas=[{
                "document_id": str(document_id),
                "rfp_number": rfp_number,
                "query": query,
                "response": response,
                "category": category,
                "type": "Q&A",
                "year": self._extract_year(rfp_number),
                **(metadata or {})
            }]
        )

        logger.info(f"Added Q&A pair to ChromaDB: {qa_id}")
        return qa_id

    def add_corrigendum(
        self,
        document_id: int,
        rfp_number: str,
        title: str,
        content: str,
        embeddings: List[float],
        metadata: Dict = None
    ) -> str:
        """Add corrigendum to vector database"""
        chroma_id = f"corr_{document_id}"

        self.corrigendum_collection.add(
            ids=[chroma_id],
            embeddings=[embeddings],
            documents=[content[:1000]],
            metadatas=[{
                "document_id": str(document_id),
                "rfp_number": rfp_number,
                "title": title,
                "type": "CORRIGENDUM",
                "year": self._extract_year(rfp_number),
                **(metadata or {})
            }]
        )

        logger.info(f"Added corrigendum to ChromaDB: {chroma_id}")
        return chroma_id

    def semantic_search_qa(
        self,
        query_embeddings: List[float],
        rfp_number: Optional[str] = None,
        category: Optional[str] = None,
        n_results: int = 5
    ) -> List[Dict]:
        """
        Semantic search for similar Q&A pairs
        Primary method used in Screen 07 (Pre-bid Query Management)

        Args:
            query_embeddings: Vector embeddings for the query
            rfp_number: Filter by specific RFP (optional)
            category: Filter by category (optional)
            n_results: Number of results to return

        Returns:
            List[Dict]: Similar Q&A pairs with similarity scores
        """
        # Build where filter
        where_filter = {}
        if rfp_number:
            where_filter["rfp_number"] = rfp_number
        if category:
            where_filter["category"] = category

        # Perform semantic search
        results = self.qa_collection.query(
            query_embeddings=[query_embeddings],
            n_results=n_results,
            where=where_filter if where_filter else None
        )

        return self._format_results(results)

    def semantic_search_rfp(
        self,
        query_embeddings: List[float],
        rfp_number: Optional[str] = None,
        n_results: int = 3
    ) -> List[Dict]:
        """
        Search for relevant RFP sections
        Used to find context from RFP documents

        Args:
            query_embeddings: Vector embeddings for the query
            rfp_number: Filter by specific RFP (optional)
            n_results: Number of results to return

        Returns:
            List[Dict]: Relevant RFP sections
        """
        where_filter = None
        if rfp_number:
            where_filter = {"rfp_number": rfp_number}

        results = self.rfp_collection.query(
            query_embeddings=[query_embeddings],
            n_results=n_results,
            where=where_filter
        )

        return self._format_results(results)

    def semantic_search_all(
        self,
        query_embeddings: List[float],
        rfp_number: Optional[str] = None,
        n_results: int = 10
    ) -> Dict[str, List[Dict]]:
        """
        Search across all collections (RFP, Q&A, Corrigendum)

        Returns:
            Dict with results from each collection
        """
        return {
            "qa_results": self.semantic_search_qa(
                query_embeddings, rfp_number, n_results=n_results
            ),
            "rfp_results": self.semantic_search_rfp(
                query_embeddings, rfp_number, n_results=min(n_results, 3)
            ),
            "corrigendum_results": self._search_corrigenda(
                query_embeddings, rfp_number, n_results=min(n_results, 3)
            )
        }

    def _search_corrigenda(
        self,
        query_embeddings: List[float],
        rfp_number: Optional[str] = None,
        n_results: int = 3
    ) -> List[Dict]:
        """Search corrigenda collection"""
        where_filter = None
        if rfp_number:
            where_filter = {"rfp_number": rfp_number}

        results = self.corrigendum_collection.query(
            query_embeddings=[query_embeddings],
            n_results=n_results,
            where=where_filter
        )

        return self._format_results(results)

    def _format_results(self, results) -> List[Dict]:
        """
        Format ChromaDB results into a clean structure

        Returns:
            List of dicts with: id, document, metadata, distance, similarity
        """
        if not results or not results['ids'] or not results['ids'][0]:
            return []

        formatted = []

        for i in range(len(results['ids'][0])):
            # Calculate similarity from distance (0 = identical, higher = less similar)
            distance = results['distances'][0][i] if 'distances' in results else 0
            similarity = max(0, 1 - distance)  # Convert distance to similarity

            formatted.append({
                'id': results['ids'][0][i],
                'document': results['documents'][0][i],
                'metadata': results['metadatas'][0][i],
                'distance': distance,
                'similarity': similarity,
                'similarity_percentage': similarity * 100
            })

        return formatted

    def _extract_year(self, rfp_number: str) -> str:
        """Extract year from RFP number (e.g., RFP-2023-NH-145 -> 2023)"""
        import re
        match = re.search(r'(\d{4})', rfp_number)
        return match.group(1) if match else "unknown"

    def get_collection_stats(self) -> Dict:
        """Get statistics about all collections"""
        return {
            "rfp_documents": self.rfp_collection.count(),
            "qa_documents": self.qa_collection.count(),
            "corrigendum_documents": self.corrigendum_collection.count(),
            "total_documents": (
                self.rfp_collection.count() +
                self.qa_collection.count() +
                self.corrigendum_collection.count()
            )
        }

    def delete_document(self, document_id: int, doc_type: str):
        """Delete document from vector database"""
        if doc_type == "RFP":
            self.rfp_collection.delete(ids=[f"rfp_{document_id}"])
        elif doc_type == "Q&A":
            # For Q&A, we need to delete all pairs associated with this document
            # This requires querying first
            results = self.qa_collection.get(
                where={"document_id": str(document_id)}
            )
            if results and results['ids']:
                self.qa_collection.delete(ids=results['ids'])
        elif doc_type == "CORRIGENDUM":
            self.corrigendum_collection.delete(ids=[f"corr_{document_id}"])

        logger.info(f"Deleted {doc_type} document {document_id} from ChromaDB")

    def update_document(
        self,
        document_id: int,
        doc_type: str,
        embeddings: List[float] = None,
        metadata: Dict = None
    ):
        """Update document embeddings or metadata"""
        chroma_id = f"{doc_type.lower()}_{document_id}"

        collection = {
            "RFP": self.rfp_collection,
            "Q&A": self.qa_collection,
            "CORRIGENDUM": self.corrigendum_collection
        }.get(doc_type)

        if not collection:
            raise ValueError(f"Invalid document type: {doc_type}")

        if embeddings:
            collection.update(
                ids=[chroma_id],
                embeddings=[embeddings]
            )

        if metadata:
            collection.update(
                ids=[chroma_id],
                metadatas=[metadata]
            )

        logger.info(f"Updated {doc_type} document {document_id} in ChromaDB")
