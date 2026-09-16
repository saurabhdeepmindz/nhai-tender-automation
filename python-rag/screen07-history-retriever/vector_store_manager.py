"""
Screen 7: Vector Store Manager
NHAI AI-Driven Tender Query Automation System

Manages ChromaDB vector store for historical data storage and retrieval.
Handles document CRUD operations, similarity search, and statistics.

Author: NHAI Development Team
Version: 1.0.0
"""

import os
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime
import chromadb
from chromadb.config import Settings
from chromadb.utils import embedding_functions

from config_manager import ConfigManager

logger = logging.getLogger(__name__)

class VectorStoreManager:
    """
    Manages ChromaDB vector store for historical RFPs, Q&A, and corrigenda
    
    Features:
    - Document storage with embeddings
    - Similarity search
    - Metadata filtering
    - Statistics and health checks
    """
    
    def __init__(self, config_manager: ConfigManager):
        """
        Initialize Vector Store Manager
        
        Args:
            config_manager: Configuration manager instance
        """
        self.config = config_manager
        self.client = None
        self.collection = None
        self.collection_name = "nhai_historical_data"
        
        logger.info("Vector Store Manager initialized")
    
    async def initialize(self):
        """Initialize ChromaDB client and collection"""
        try:
            # Initialize ChromaDB client
            persist_directory = self.config.get("vector_store_path", "./chroma_db")
            
            self.client = chromadb.Client(Settings(
                chroma_db_impl="duckdb+parquet",
                persist_directory=persist_directory,
                anonymized_telemetry=False
            ))
            
            # Create or get collection
            self.collection = self.client.get_or_create_collection(
                name=self.collection_name,
                metadata={"description": "NHAI Historical RFP, Q&A, and Corrigenda data"}
            )
            
            logger.info(f"ChromaDB collection '{self.collection_name}' ready")
            logger.info(f"Storage location: {persist_directory}")
            
        except Exception as e:
            logger.error(f"Failed to initialize vector store: {str(e)}")
            raise
    
    # ========================================================================
    # Document Operations
    # ========================================================================
    
    async def add_documents(
        self,
        document_id: str,
        chunks: List[Dict[str, Any]],
        metadata: Dict[str, Any]
    ):
        """
        Add document chunks to the vector store
        
        Args:
            document_id: Unique document identifier
            chunks: List of chunks with text, embedding, metadata
            metadata: Document-level metadata
        """
        try:
            # Prepare data for ChromaDB
            ids = []
            embeddings = []
            documents = []
            metadatas = []
            
            for i, chunk in enumerate(chunks):
                chunk_id = f"{document_id}_chunk_{i}"
                
                ids.append(chunk_id)
                embeddings.append(chunk["embedding"])
                documents.append(chunk["text"])
                
                # Merge document and chunk metadata
                chunk_metadata = metadata.copy()
                chunk_metadata.update(chunk["metadata"])
                chunk_metadata["document_id"] = document_id
                metadatas.append(chunk_metadata)
            
            # Add to ChromaDB
            self.collection.add(
                ids=ids,
                embeddings=embeddings,
                documents=documents,
                metadatas=metadatas
            )
            
            logger.info(f"Added {len(chunks)} chunks for document {document_id}")
            
        except Exception as e:
            logger.error(f"Failed to add documents: {str(e)}")
            raise
    
    async def delete_document(self, document_id: str) -> bool:
        """
        Delete all chunks of a document
        
        Args:
            document_id: Document to delete
            
        Returns:
            True if successful
        """
        try:
            # Find all chunks for this document
            results = self.collection.get(
                where={"document_id": document_id}
            )
            
            if results and results["ids"]:
                # Delete all chunks
                self.collection.delete(ids=results["ids"])
                logger.info(f"Deleted document {document_id} ({len(results['ids'])} chunks)")
                return True
            else:
                logger.warning(f"Document {document_id} not found")
                return False
                
        except Exception as e:
            logger.error(f"Failed to delete document {document_id}: {str(e)}")
            return False
    
    # ========================================================================
    # Search Operations
    # ========================================================================
    
    async def similarity_search(
        self,
        query_embedding: List[float],
        top_k: int = 5,
        filters: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """
        Perform similarity search
        
        Args:
            query_embedding: Query embedding vector
            top_k: Number of results to return
            filters: Metadata filters
            
        Returns:
            List of search results with text, score, metadata
        """
        try:
            # Build query parameters
            query_params = {
                "query_embeddings": [query_embedding],
                "n_results": top_k
            }
            
            # Add filters if provided
            if filters:
                query_params["where"] = filters
            
            # Execute search
            results = self.collection.query(**query_params)
            
            # Format results
            formatted_results = []
            
            if results and results["documents"]:
                for i in range(len(results["documents"][0])):
                    formatted_results.append({
                        "document_id": results["metadatas"][0][i].get("document_id", "unknown"),
                        "text": results["documents"][0][i],
                        "score": 1 - results["distances"][0][i],  # Convert distance to similarity
                        "metadata": results["metadatas"][0][i]
                    })
            
            return formatted_results
            
        except Exception as e:
            logger.error(f"Similarity search failed: {str(e)}")
            raise
    
    # ========================================================================
    # Statistics and Management
    # ========================================================================
    
    async def get_stats(self) -> Dict[str, Any]:
        """
        Get vector store statistics
        
        Returns:
            Statistics including counts by type, storage size, etc.
        """
        try:
            # Get all documents
            all_docs = self.collection.get()
            
            if not all_docs or not all_docs["metadatas"]:
                return {
                    "total_documents": 0,
                    "total_chunks": 0,
                    "rfp_count": 0,
                    "qa_count": 0,
                    "corrigendum_count": 0,
                    "storage_size_mb": 0.0,
                    "last_update": datetime.now().isoformat()
                }
            
            # Count unique documents
            document_ids = set()
            rfp_count = 0
            qa_count = 0
            corrigendum_count = 0
            
            for metadata in all_docs["metadatas"]:
                doc_id = metadata.get("document_id")
                if doc_id:
                    document_ids.add(doc_id)
                
                doc_type = metadata.get("document_type", "").upper()
                if doc_type == "RFP":
                    rfp_count += 1
                elif doc_type == "QA":
                    qa_count += 1
                elif doc_type == "CORRIGENDUM":
                    corrigendum_count += 1
            
            # Calculate storage size (approximate)
            total_text_size = sum(len(doc) for doc in all_docs["documents"])
            storage_size_mb = total_text_size / (1024 * 1024)
            
            return {
                "total_documents": len(document_ids),
                "total_chunks": len(all_docs["documents"]),
                "rfp_count": len([d for d in document_ids if "RFP" in d]),
                "qa_count": len([d for d in document_ids if "QA" in d]),
                "corrigendum_count": len([d for d in document_ids if "CORR" in d]),
                "storage_size_mb": round(storage_size_mb, 2),
                "last_update": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Failed to get stats: {str(e)}")
            return {}
    
    async def list_documents(
        self,
        skip: int = 0,
        limit: int = 100,
        document_type: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        List all documents with pagination
        
        Args:
            skip: Number of documents to skip
            limit: Maximum documents to return
            document_type: Filter by document type (RFP, QA, Corrigendum)
            
        Returns:
            List of document metadata
        """
        try:
            # Build query
            query_params = {}
            if document_type:
                query_params["where"] = {"document_type": document_type.upper()}
            
            # Get all matching documents
            results = self.collection.get(**query_params)
            
            if not results or not results["metadatas"]:
                return []
            
            # Extract unique documents
            unique_docs = {}
            for i, metadata in enumerate(results["metadatas"]):
                doc_id = metadata.get("document_id")
                if doc_id and doc_id not in unique_docs:
                    unique_docs[doc_id] = {
                        "document_id": doc_id,
                        "rfp_number": metadata.get("rfp_number", "Unknown"),
                        "title": metadata.get("title", "Untitled"),
                        "document_type": metadata.get("document_type", "Unknown"),
                        "upload_date": metadata.get("upload_date", "Unknown"),
                        "chunk_count": 1
                    }
                elif doc_id:
                    unique_docs[doc_id]["chunk_count"] += 1
            
            # Convert to list and apply pagination
            documents = list(unique_docs.values())
            return documents[skip:skip + limit]
            
        except Exception as e:
            logger.error(f"Failed to list documents: {str(e)}")
            return []
    
    async def reindex_all(self):
        """
        Reindex all documents (clear and rebuild)
        
        Used when configuration changes
        """
        try:
            logger.info("Starting reindexing...")
            
            # Get all current documents
            all_docs = self.collection.get()
            
            if all_docs and all_docs["documents"]:
                # Delete existing collection
                self.client.delete_collection(self.collection_name)
                
                # Recreate collection
                self.collection = self.client.create_collection(
                    name=self.collection_name,
                    metadata={"description": "NHAI Historical RFP, Q&A, and Corrigenda data"}
                )
                
                logger.info("Collection recreated, ready for new indexing")
            
        except Exception as e:
            logger.error(f"Reindexing failed: {str(e)}")
            raise
    
    async def close(self):
        """Close vector store connection"""
        try:
            if self.client:
                # ChromaDB doesn't require explicit closing
                logger.info("Vector store connection closed")
        except Exception as e:
            logger.error(f"Failed to close vector store: {str(e)}")
