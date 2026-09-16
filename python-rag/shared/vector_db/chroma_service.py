# rag_service/vector_db/chroma_service.py

import chromadb
from chromadb.config import Settings
from typing import List, Dict, Optional
import uuid
import logging
from datetime import datetime
import hashlib

logger = logging.getLogger(__name__)


class ChromaService:
    """
    ChromaDB service for storing and retrieving document embeddings
    Used for semantic search in Pre-bid Query Management (Screen 07)
    """

    def __init__(self, persist_directory: str = "./chroma_db", qa_collection_name: str = "qa_documents"):
        """
        Initialize ChromaDB client with persistent storage
        
        Args:
            persist_directory: Path to ChromaDB persistent storage
            qa_collection_name: Name of Q&A collection (default: "qa_documents", but can be "vendor_queries" for unified storage)
        """
        # Use new ChromaDB API (0.4.x)
        self.client = chromadb.PersistentClient(path=persist_directory)
        self.qa_collection_name = qa_collection_name

        # Create collections for each document type
        self.rfp_collection = self.client.get_or_create_collection(
            name="rfp_documents",
            metadata={
                "description": "RFP documents and content",
                "hnsw:space": "cosine"  # Use cosine similarity
            },
            embedding_function=None  # We'll provide embeddings ourselves
        )

        self.qa_collection = self.client.get_or_create_collection(
            name=qa_collection_name,
            metadata={
                "description": "Pre-bid Q&A pairs for semantic search",
                "hnsw:space": "cosine"  # Use cosine similarity (CRITICAL!)
            },
            embedding_function=None
        )

        self.corrigendum_collection = self.client.get_or_create_collection(
            name="corrigendum_documents",
            metadata={
                "description": "Corrigendum documents",
                "hnsw:space": "cosine"  # Use cosine similarity
            },
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

    def add_rfp_chunk(
        self,
        document_id: int,
        rfp_number: str,
        title: str,
        chunk_text: str,
        chunk_index: int,
        embeddings: List[float],
        metadata: Dict = None
    ) -> str:
        """
        Add RFP chunk to vector database
        Used for chunked documents to improve search accuracy
        
        Args:
            document_id: Database ID of the historical document
            rfp_number: RFP reference number (e.g., RFP-2023-NH-145)
            title: Document title
            chunk_text: Text content of this chunk
            chunk_index: Index of this chunk (0-based)
            embeddings: Vector embeddings for the chunk
            metadata: Additional metadata (optional)
        
        Returns:
            str: ChromaDB ID for the stored chunk
        """
        chroma_id = f"rfp_{document_id}_chunk_{chunk_index}"
        
        self.rfp_collection.add(
            ids=[chroma_id],
            embeddings=[embeddings],
            documents=[chunk_text],
            metadatas=[{
                "document_id": str(document_id),
                "rfp_number": rfp_number,
                "title": title,
                "chunk_index": chunk_index,
                "type": "RFP",
                "year": self._extract_year(rfp_number),
                **(metadata or {})
            }]
        )
        
        logger.info(f"Added RFP chunk to ChromaDB: {chroma_id}")
        return chroma_id

    def _check_qa_duplicate(
        self,
        rfp_number: str,
        query: str,
        category: str
    ) -> Dict:
        """
        Check if a Q&A pair already exists (duplicate detection)
        Uses: RFP number + Query text + Category as unique key

        Args:
            rfp_number: RFP identification number
            query: Query text to check
            category: Category of the query

        Returns:
            dict with keys: exists (bool), id (str if exists), details (dict)
        """
        try:
            # Search for existing QA with same RFP and category
            results = self.qa_collection.get(
                where={
                    "$and": [
                        {"rfp_number": rfp_number},
                        {"category": category}
                    ]
                },
                include=["documents", "metadatas"]
            )
            
            # Check if any existing query matches
            if results['ids']:
                for existing_id, existing_meta in zip(results['ids'], results['metadatas']):
                    if existing_meta.get('query') == query:
                        logger.warning(
                            f"[_check_qa_duplicate] ⚠️  DUPLICATE DETECTED for RFP {rfp_number}, "
                            f"Category: {category}, Query: {query[:50]}... | Existing ID: {existing_id}"
                        )
                        return {
                            "exists": True,
                            "id": existing_id,
                            "details": existing_meta
                        }
            
            return {"exists": False, "id": None, "details": None}
        
        except Exception as e:
            logger.debug(f"[_check_qa_duplicate] No existing QAs found or error: {str(e)}")
            return {"exists": False, "id": None, "details": None}

    def add_qa_pair(
        self,
        document_id: int,
        rfp_number: str,
        query: str,
        response: str,
        query_embeddings: List[float],
        category: str = "General",
        metadata: Dict = None,
        check_duplicate: bool = True,
        upsert_if_duplicate: bool = False
    ) -> str:
        """
        Add Q&A pair to vector database for semantic search with duplicate prevention

        Args:
            document_id: Unique document ID from PostgreSQL
            rfp_number: RFP identification number
            query: Original query text
            response: Response text
            query_embeddings: Vector embeddings for the query
            category: Query category
            metadata: Additional metadata
            check_duplicate: Whether to check for existing QA pairs (default: True)
            upsert_if_duplicate: If duplicate found, update existing instead of skipping (default: False)

        Returns:
            str: ChromaDB ID (existing ID if duplicate, or new/updated ID)
        """
        logger.info(
            f"[add_qa_pair] Processing Q&A pair - RFP: {rfp_number}, Category: {category}, "
            f"Query: {query[:60]}..."
        )
        
        # Check for duplicates
        duplicate_check = {"exists": False}
        if check_duplicate:
            logger.info(f"[add_qa_pair] Checking for duplicates (RFP: {rfp_number}, Category: {category})...")
            duplicate_check = self._check_qa_duplicate(rfp_number, query, category)
        
        if duplicate_check.get("exists"):
            existing_id = duplicate_check.get("id")
            logger.warning(
                f"[add_qa_pair] ❌ DUPLICATE FOUND: {existing_id} | "
                f"RFP: {rfp_number}, Category: {category}"
            )
            
            if upsert_if_duplicate:
                logger.info(f"[add_qa_pair] 🔄 Updating existing Q&A pair: {existing_id}")
                # Update existing record
                combined_text = f"Query: {query}\n\nResponse: {response}"
                self.qa_collection.update(
                    ids=[existing_id],
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
                        "last_updated": datetime.now().isoformat(),
                        **(metadata or {})
                    }]
                )
                logger.info(f"[add_qa_pair] ✅ Updated existing Q&A pair: {existing_id}")
                return existing_id
            else:
                logger.info(
                    f"[add_qa_pair] ↩️  Skipping duplicate (use upsert_if_duplicate=True to update): {existing_id}"
                )
                return existing_id  # Return existing ID without adding duplicate
        
        # Generate unique ID for new Q&A pair (deterministic based on content)
        id_base = f"{rfp_number}_{category}_{query}"
        id_hash = hashlib.md5(id_base.encode()).hexdigest()[:8]
        qa_id = f"qa_{document_id}_{id_hash}"
        
        logger.info(f"[add_qa_pair] ✅ New Q&A pair - Generated ID: {qa_id}")

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
                "created_at": datetime.now().isoformat(),
                **(metadata or {})
            }]
        )

        logger.info(f"[add_qa_pair] ✅ Added new Q&A pair to ChromaDB: {qa_id}")
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
        document_id: Optional[int] = None,
        n_results: int = 5,
        similarity_threshold: float = 0.7
    ) -> List[Dict]:
        """
        Semantic search for similar Q&A pairs
        Primary method used in Screen 07 (Pre-bid Query Management)

        Args:
            query_embeddings: Vector embeddings for the query
            rfp_number: Filter by specific RFP (optional)
            category: Filter by category (optional)
            document_id: Filter by document ID (optional)
            n_results: Number of results to return

        Returns:
            List[Dict]: Similar Q&A pairs with similarity scores
        """
        # Build where filter
        # Build where filter - document_id takes precedence
        where_filter = None
        if document_id is not None:
            # Note: document_id is stored as string in metadata, so convert for filtering
            where_filter = {"document_id": str(document_id)}
        elif rfp_number or category:
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
        formatted = self._format_results(results)
        # Attach similarity scores and filter if needed
        for item in formatted:
            sim = item.get("similarity")
            if sim is not None:
                item["similarity_percentage"] = round(sim * 100, 2)
        return formatted

    def semantic_search_rfp(
        self,
        query_embeddings: List[float],
        rfp_number: Optional[str] = None,
        document_id: Optional[int] = None,
        n_results: int = 3,
        similarity_threshold: float = 0.7
    ) -> List[Dict]:
        """
        Search for relevant RFP sections
        Used to find context from RFP documents

        Args:
            query_embeddings: Vector embeddings for the query
            rfp_number: Filter by specific RFP (optional)
            document_id: Filter by document (takes precedence)
            n_results: Number of results to return

        Returns:
            List[Dict]: Relevant RFP sections
        """
        # document_id takes precedence over rfp_number
        where_filter = None
        if document_id is not None:
            where_filter = {"document_id": document_id}
        elif rfp_number:
            where_filter = {"rfp_number": rfp_number}

        results = self.rfp_collection.query(
            query_embeddings=[query_embeddings],
            n_results=n_results,
            where=where_filter
        )
        formatted = self._format_results(results)
        for item in formatted:
            sim = item.get("similarity")
            if sim is not None:
                item["similarity_percentage"] = round(sim * 100, 2)
        return formatted

    def semantic_search_all(
        self,
        query_embeddings: List[float],
        rfp_number: Optional[str] = None,
        n_results: int = 10,
        similarity_threshold: float = 0.7
    ) -> Dict[str, List[Dict]]:
        """
        Search across all collections (RFP, Q&A, Corrigendum)

        Returns:
            Dict with results from each collection
        """
        return {
            "qa_results": self.semantic_search_qa(
                query_embeddings, rfp_number, n_results=n_results, similarity_threshold=similarity_threshold
            ),
            "rfp_results": self.semantic_search_rfp(
                query_embeddings, rfp_number, n_results=min(n_results, 3), similarity_threshold=similarity_threshold
            ),
            "corrigendum_results": self._search_corrigenda(
                query_embeddings, rfp_number, n_results=min(n_results, 3)
            )
        }

    def _search_corrigenda(
        self,
        query_embeddings: List[float],
        rfp_number: Optional[str] = None,
        document_id: Optional[int] = None,
        n_results: int = 3
    ) -> List[Dict]:
        """Search corrigenda collection"""
        # document_id takes precedence over rfp_number
        where_filter = None
        if document_id is not None:
            where_filter = {"document_id": document_id}
        elif rfp_number:
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

    def get_chunks_by_document_id(self, document_id: int, doc_type: str = "RFP") -> List[Dict]:
        """Retrieve all chunks for a specific document_id from the specified collection"""
        collection = {
            "RFP": self.rfp_collection,
            "Q&A": self.qa_collection,
            "CORRIGENDUM": self.corrigendum_collection,
        }.get(doc_type)

        if not collection:
            return []

        try:
            # Try filtering by string document_id first
            results = collection.get(where={"document_id": str(document_id)})
            
            # If no results, try integer (ChromaDB may store as int)
            if not results or not results.get("ids"):
                results = collection.get(where={"document_id": document_id})
        except Exception as e:
            logger.warning(f"Query with where filter failed: {str(e)}. Falling back to in-memory filtering...")
            # Fallback: get all and filter in memory
            results = collection.get()
            if results and results.get("metadatas"):
                doc_id_str = str(document_id)
                filtered_ids = []
                filtered_docs = []
                filtered_metas = []
                
                for id_, doc, meta in zip(
                    results.get("ids", []),
                    results.get("documents", []),
                    results.get("metadatas", [])
                ):
                    if meta and (meta.get("document_id") == doc_id_str or meta.get("document_id") == document_id):
                        filtered_ids.append(id_)
                        filtered_docs.append(doc)
                        filtered_metas.append(meta)
                
                results = {
                    "ids": filtered_ids,
                    "documents": filtered_docs,
                    "metadatas": filtered_metas,
                }

        formatted = []
        if not results or not results.get("ids"):
            logger.warning(f"No chunks found for document {document_id} (type={doc_type})")
            return formatted

        ids = results.get("ids", [])
        docs = results.get("documents", [])
        metas = results.get("metadatas", [])

        # Handle both list and nested list responses
        if ids and isinstance(ids[0], list):
            ids = ids[0]
        if docs and isinstance(docs[0], list):
            docs = docs[0]
        if metas and isinstance(metas[0], list):
            metas = metas[0]

        for i in range(len(ids)):
            formatted.append({
                "id": ids[i] if i < len(ids) else "",
                "document": docs[i] if i < len(docs) else "",
                "metadata": metas[i] if i < len(metas) else {},
                "similarity": None,
                "similarity_percentage": None,
            })

        logger.info(f"Retrieved {len(formatted)} chunks for document {document_id} (type={doc_type})")
        return formatted

    def keyword_search_in_chunks(self, document_id: int, doc_type: str, keywords: List[str], max_results: int = 3) -> List[Dict]:
        """
        Simple keyword-based fallback search over stored chunks for a document.
        Returns chunks that contain any of the given keywords.
        """
        chunks = self.get_chunks_by_document_id(document_id, doc_type)
        if not chunks:
            return []

        keywords_lower = [k.lower() for k in keywords if k and len(k) > 2]
        scored = []
        for ch in chunks:
            text = (ch.get("document") or "").lower()
            hits = sum(1 for k in keywords_lower if k in text)
            if hits > 0:
                scored.append((hits, ch))

        scored.sort(key=lambda x: x[0], reverse=True)
        return [item[1] for item in scored[:max_results]]

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

    def delete_document_vectors(self, document_id: int) -> int:
        """
        Delete all vectors associated with a document from all collections
        Returns the total number of vectors deleted
        """
        total_deleted = 0
        
        # Delete from RFP collection
        try:
            rfp_results = self.rfp_collection.get(
                where={"document_id": {"$eq": document_id}}
            )
            if rfp_results and rfp_results['ids']:
                self.rfp_collection.delete(ids=rfp_results['ids'])
                total_deleted += len(rfp_results['ids'])
                logger.info(f"Deleted {len(rfp_results['ids'])} RFP vectors for document {document_id}")
        except Exception as e:
            logger.warning(f"Error deleting RFP vectors for document {document_id}: {str(e)}")
        
        # Delete from Q&A collection
        try:
            qa_results = self.qa_collection.get(
                where={"document_id": {"$eq": document_id}}
            )
            if qa_results and qa_results['ids']:
                self.qa_collection.delete(ids=qa_results['ids'])
                total_deleted += len(qa_results['ids'])
                logger.info(f"Deleted {len(qa_results['ids'])} Q&A vectors for document {document_id}")
        except Exception as e:
            logger.warning(f"Error deleting Q&A vectors for document {document_id}: {str(e)}")
        
        # Delete from Corrigendum collection
        try:
            corr_results = self.corrigendum_collection.get(
                where={"document_id": {"$eq": document_id}}
            )
            if corr_results and corr_results['ids']:
                self.corrigendum_collection.delete(ids=corr_results['ids'])
                total_deleted += len(corr_results['ids'])
                logger.info(f"Deleted {len(corr_results['ids'])} Corrigendum vectors for document {document_id}")
        except Exception as e:
            logger.warning(f"Error deleting Corrigendum vectors for document {document_id}: {str(e)}")
        
        logger.info(f"Total vectors deleted for document {document_id}: {total_deleted}")
        return total_deleted

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
