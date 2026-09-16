"""
Historical Data Service - Port 8005
Processes historical documents with Ollama (primary) + OpenAI (fallback)
"""

import os
import sys
import logging
from datetime import datetime
from pathlib import Path

from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# Add shared utilities to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'shared'))
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'shared', 'document_processing'))
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'shared', 'vector_db'))


from document_processor import DocumentProcessor
from chroma_service import ChromaService
from ingestion_verification import verify_ingestion_reconciliation

# Setup logging to both terminal and file
log_dir = os.path.join(os.path.dirname(__file__), 'logs')
os.makedirs(log_dir, exist_ok=True)
log_file = os.path.join(log_dir, 'service.log')

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

# Formatter
formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')

# Console handler
console_handler = logging.StreamHandler()
console_handler.setFormatter(formatter)
logger.addHandler(console_handler)

# File handler
file_handler = logging.FileHandler(log_file, mode='a', encoding='utf-8')
file_handler.setFormatter(formatter)
logger.addHandler(file_handler)

# =============================================================================
# Pydantic Models
# =============================================================================

class ProcessDocumentRequest(BaseModel):
    document_id: int
    file_path: str
    file_name: str
    document_type: str = Field(..., description="RFP, Q&A, or CORRIGENDUM")
    rfp_number: str
    title: str

class ProcessDocumentResponse(BaseModel):
    success: bool
    document_id: int
    chunks_processed: int
    vector_ids: list
    extracted_content: str
    processing_time: float
    embedding_provider: str
    message: str

class QueryDocumentRequest(BaseModel):
    document_id: int
    question: str
    document_type: str = Field(..., description="RFP, Q&A, or CORRIGENDUM")
    rfp_number: str = Field(None, description="Optional RFP number for filtering")

class QuerySource(BaseModel):
    content: str
    metadata: dict
    similarity: float

class QueryDocumentResponse(BaseModel):
    success: bool
    document_id: int
    question: str
    answer: str
    sources: list
    embedding_provider: str
    processing_time: float

class DeleteDocumentResponse(BaseModel):
    success: bool
    document_id: int
    vectors_deleted: int
    message: str

# =============================================================================
# Initialize FastAPI
# =============================================================================

app = FastAPI(
    title="NHAI Historical Data Service",
    description="Document processing with Ollama/OpenAI embeddings",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global services
document_processor = None
chroma_service = None
chroma_service_qa = None  # Separate ChromaDB for Q&A (Instance #4)

# =============================================================================
# Service Initialization
# =============================================================================

def initialize_services():
    """Initialize document processor and ChromaDB"""
    global document_processor, chroma_service, chroma_service_qa
    
    try:
        logger.info("="*60)
        logger.info("Initializing Historical Data Service...")
        
        # 1. Initialize document processor
        embedding_provider = os.getenv("EMBEDDING_PROVIDER", "ollama")
        ollama_base_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
        ollama_model = os.getenv("OLLAMA_EMBEDDING_MODEL", "nomic-embed-text")
        openai_api_key = os.getenv("OPENAI_API_KEY")
        
        document_processor = DocumentProcessor(
            embedding_model=embedding_provider,
            openai_api_key=openai_api_key,
            ollama_base_url=ollama_base_url,
            ollama_model=ollama_model,
            chunk_size=int(os.getenv("CHUNK_SIZE", "1000")),
            chunk_overlap=int(os.getenv("CHUNK_OVERLAP", "200"))
        )
        
        logger.info(f"✓ Document processor: {document_processor.get_active_provider()}")
        
        # 2. Initialize ChromaDB for Instance #3 (RFP & Corrigendum documents)
        chroma_dir = os.getenv("CHROMA_DB_DIR", "./chroma_db")
        Path(chroma_dir).mkdir(parents=True, exist_ok=True)
        
        chroma_service = ChromaService(persist_directory=chroma_dir)
        
        logger.info(f"✓ ChromaDB Instance #3 (RFP & Corrigendum): {chroma_dir}")
        
        # 3. Initialize separate ChromaDB for Instance #4 (Q&A documents)
        # Path is relative to historical-data-service, so go up 1 level to python-rag and into screen08-chief-engineer
        chroma_qa_dir = os.path.join(
            os.path.dirname(__file__), '..', 'screen08-chief-engineer', 'query_db'
        )
        chroma_qa_dir = os.path.abspath(chroma_qa_dir)
        Path(chroma_qa_dir).mkdir(parents=True, exist_ok=True)
        
        # Use "vendor_queries" collection for Q&A to have single source of truth
        chroma_service_qa = ChromaService(persist_directory=chroma_qa_dir, qa_collection_name="vendor_queries")
        
        logger.info(f"✓ ChromaDB Instance #4 (Q&A): {chroma_qa_dir}")
        logger.info(f"✓ Q&A Collection Name: vendor_queries (unified with other queries)")
        logger.info("="*60)
        logger.info("✅ Service Ready with Dual ChromaDB Routing!")
        logger.info("   - Instance #3: RFP & Corrigendum documents")
        logger.info("   - Instance #4: Q&A pairs (prebid queries)")
        logger.info("="*60)
        
    except Exception as e:
        logger.error(f"❌ Initialization failed: {str(e)}")
        raise

# =============================================================================
# API Endpoints
# =============================================================================

@app.on_event("startup")
async def startup_event():
    """Initialize on startup"""
    initialize_services()

@app.get("/")
async def root():
    """Health check"""
    return {
        "status": "running",
        "service": "NHAI Historical Data Service",
        "service": "NHAI Historical Data Service",
        "version": "1.0.0",
        "timestamp": datetime.now().isoformat(),
        "embedding_provider": document_processor.get_active_provider() if document_processor else "unknown"
    }

@app.post("/api/process-document", response_model=ProcessDocumentResponse)
async def process_document(request: ProcessDocumentRequest):
    """
    Process uploaded historical document
    """
    logger.info(f"📥 Processing: {request.file_name} (Type: {request.document_type})")
    start_time = datetime.now()
    
    try:
        vector_ids = []
        
        # Process based on document type
        if request.document_type == "RFP":
            result = await document_processor.process_rfp_document(
                file_path=request.file_path,
                document_id=request.document_id,
                rfp_number=request.rfp_number,
                title=request.title
            )
            
            # Store chunks in ChromaDB
            for chunk_data in result['chunk_embeddings']:
                vector_id = chroma_service.add_rfp_chunk(
                    document_id=request.document_id,
                    rfp_number=request.rfp_number,
                    title=request.title,
                    chunk_text=chunk_data['text'],
                    chunk_index=chunk_data['chunk_index'],
                    embeddings=chunk_data['embedding'],
                    metadata=result['metadata']
                )
                vector_ids.append(vector_id)
            
            extracted_content = result['extracted_content']
            
        elif request.document_type == "Q&A":
            # Detect file type and process accordingly
            if request.file_path.lower().endswith('.csv'):
                qa_pairs = await document_processor.process_qa_csv(
                    file_path=request.file_path,
                    document_id=request.document_id,
                    rfp_number=request.rfp_number
                )
            elif request.file_path.lower().endswith('.pdf'):
                qa_pairs = await document_processor.process_qa_pdf(
                    file_path=request.file_path,
                    document_id=request.document_id,
                    rfp_number=request.rfp_number
                )
            else:
                raise HTTPException(
                    status_code=400,
                    detail=f"Unsupported Q&A file format. Expected CSV or PDF, got: {request.file_path}"
                )
            
            # Store each Q&A pair in Instance #4 (query_db)
            for qa in qa_pairs:
                vector_id = chroma_service_qa.add_qa_pair(
                    document_id=request.document_id,
                    rfp_number=request.rfp_number,
                    query=qa['query'],
                    response=qa['response'],
                    query_embeddings=qa['combined_embedding'],
                    category=qa['category'],
                    metadata=qa['metadata']
                )
                vector_ids.append(vector_id)
            
            extracted_content = f"Processed {len(qa_pairs)} Q&A pairs"
            logger.info(f"📝 Q&A document stored in Instance #4 (query_db): {len(qa_pairs)} pairs")
            
            # Run verification and reconciliation
            logger.info("\n")
            chroma_qa_dir = os.path.join(
                os.path.dirname(__file__), '..', 'screen08-chief-engineer', 'query_db'
            )
            chroma_qa_dir = os.path.abspath(chroma_qa_dir)
            verification_result = verify_ingestion_reconciliation(
                pdf_rows_count=len(qa_pairs),
                chroma_persist_dir=chroma_qa_dir,
                collection_name="vendor_queries"
            )
            logger.info("")
            
        elif request.document_type == "CORRIGENDUM":
            result = await document_processor.process_corrigendum(
                file_path=request.file_path,
                document_id=request.document_id,
                rfp_number=request.rfp_number,
                title=request.title
            )
            
            # Store in ChromaDB
            for chunk_data in result['chunk_embeddings']:
                vector_id = chroma_service.add_corrigendum(
                    document_id=request.document_id,
                    rfp_number=request.rfp_number,
                    title=request.title,
                    content=chunk_data['text'],
                    embeddings=chunk_data['embedding'],
                    metadata=result['metadata']
                )
                vector_ids.append(vector_id)
            
            extracted_content = result['extracted_content']
        
        else:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported document type: {request.document_type}"
            )
        
        processing_time = (datetime.now() - start_time).total_seconds()
        
        logger.info(
            f"✅ Document {request.document_id} processed: "
            f"{len(vector_ids)} chunks in {processing_time:.2f}s"
        )
        
        return ProcessDocumentResponse(
            success=True,
            document_id=request.document_id,
            chunks_processed=len(vector_ids),
            vector_ids=vector_ids,
            extracted_content=extracted_content[:1000],
            processing_time=processing_time,
            embedding_provider=document_processor.get_active_provider(),
            message="Document processed successfully"
        )
        
    except Exception as e:
        logger.error(f"❌ Error processing document: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Processing failed: {str(e)}"
        )

@app.get("/api/stats")
async def get_stats():
    """Get ChromaDB statistics"""
    try:
        stats = chroma_service.get_collection_stats()
        return {
            "success": True,
            "statistics": stats,
            "embedding_provider": document_processor.get_active_provider(),
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/query-document", response_model=QueryDocumentResponse)
async def query_document(request: QueryDocumentRequest):
    """
    Query a processed historical document with a question
    Returns AI-generated answer based on document context
    
    Routes to appropriate ChromaDB instance:
    - RFP/CORRIGENDUM → Instance #3 (chroma_service)
    - Q&A → Instance #4 (chroma_service_qa with vendor_queries collection)
    """
    logger.info(f"📝 Query for document {request.document_id}: {request.question}")
    start_time = datetime.now()
    
    try:
        # Determine which ChromaDB instance to search based on document type
        # Q&A documents are stored in Instance #4 (vendor_queries)
        # RFP/Corrigendum are stored in Instance #3
        if request.document_type == "Q&A":
            active_chroma = chroma_service_qa
            logger.info(f"📌 Routing to Instance #4 (vendor_queries) for Q&A search")
        else:
            active_chroma = chroma_service
            logger.info(f"📌 Routing to Instance #3 for {request.document_type} search")
        
        # 1. Generate embeddings for the question
        question_embedding = await document_processor.generate_embeddings(request.question)
        
        # 2. Search appropriate ChromaDB for relevant chunks filtered by document_id
        if request.document_type == "RFP":
            results = active_chroma.semantic_search_rfp(
                query_embeddings=question_embedding,
                rfp_number=request.rfp_number,
                document_id=request.document_id,
                n_results=5
            )
        elif request.document_type == "Q&A":
            # Q&A documents are stored in vendor_queries collection
            # Use semantic_search_qa on Instance #4
            results = active_chroma.semantic_search_qa(
                query_embeddings=question_embedding,
                rfp_number=request.rfp_number,
                document_id=request.document_id,
                n_results=5
            )
        elif request.document_type == "CORRIGENDUM":
            results = active_chroma._search_corrigenda(
                query_embeddings=question_embedding,
                rfp_number=request.rfp_number,
                document_id=request.document_id,
                n_results=5
            )
        else:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported document type: {request.document_type}"
            )
        
        # 3. Filter results to only include the requested document_id
        filtered_results = [
            r for r in results 
            if r['metadata'].get('document_id') == str(request.document_id)
        ]
        
        if not filtered_results:
            # Fallback 1: Broader semantic search across appropriate instance
            all_results = active_chroma.semantic_search_all(
                query_embeddings=question_embedding,
                rfp_number=request.rfp_number,
                n_results=10
            )

            combined = (
                all_results.get("rfp_results", []) +
                all_results.get("qa_results", []) +
                all_results.get("corrigendum_results", [])
            )
            filtered_results = [r for r in combined if r['metadata'].get('document_id') == str(request.document_id)]

        if not filtered_results:
            # Fallback 2: Keyword-based search over chunks for the document
            import re
            keywords = [w for w in re.split(r"[^A-Za-z0-9]+", request.question) if w]
            keyword_hits = active_chroma.keyword_search_in_chunks(
                document_id=request.document_id,
                doc_type=request.document_type,
                keywords=keywords,
                max_results=3
            )

            if keyword_hits:
                filtered_results = keyword_hits

        if not filtered_results:
            instance_name = "Instance #4 (vendor_queries)" if request.document_type == "Q&A" else "Instance #3"
            logger.warning(f"⚠️  No results found in {instance_name} for document {request.document_id}")
            return QueryDocumentResponse(
                success=True,
                document_id=request.document_id,
                question=request.question,
                answer="I couldn't find relevant information in this document to answer your question.",
                sources=[],
                embedding_provider=document_processor.get_active_provider(),
                processing_time=(datetime.now() - start_time).total_seconds()
            )
        
        # 4. Build context from retrieved chunks
        context_parts = []
        sources = []
        
        for idx, result in enumerate(filtered_results[:3], 1):  # Top 3 chunks
            context_parts.append(f"[Source {idx}]: {result['document']}")
            sources.append({
                "content": result['document'],
                "metadata": result['metadata'],
                "similarity": result['similarity']
            })
        
        context = "\n\n".join(context_parts)
        
        # 5. Generate answer using LLM
        answer = await document_processor.generate_answer(
            question=request.question,
            context=context
        )
        
        processing_time = (datetime.now() - start_time).total_seconds()
        
        logger.info(
            f"✅ Query answered for document {request.document_id} in {processing_time:.2f}s"
        )
        
        return QueryDocumentResponse(
            success=True,
            document_id=request.document_id,
            question=request.question,
            answer=answer,
            sources=sources,
            embedding_provider=document_processor.get_active_provider(),
            processing_time=processing_time
        )
        
    except Exception as e:
        logger.error(f"❌ Error querying document: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Query failed: {str(e)}"
        )

# Debug: List stored chunks for a specific document
@app.get("/api/document/{document_id}/chunks")
async def get_document_chunks(document_id: int, doc_type: str = "RFP"):
    """Debug endpoint: list stored chunks for a specific document"""
    try:
        chunks = chroma_service.get_chunks_by_document_id(document_id, doc_type)
        return {
            "success": True,
            "document_id": document_id,
            "doc_type": doc_type,
            "count": len(chunks),
            "chunks": chunks[:10],  # limit for brevity
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Delete document vectors from ChromaDB
@app.delete("/api/documents/{document_id}", response_model=DeleteDocumentResponse)
async def delete_document(document_id: int):
    """Delete all vectors associated with a document from ChromaDB"""
    try:
        logger.info(f"Deleting vectors for document {document_id}")
        
        vectors_deleted = chroma_service.delete_document_vectors(document_id)
        
        logger.info(f"Successfully deleted {vectors_deleted} vectors for document {document_id}")
        
        return {
            "success": True,
            "document_id": document_id,
            "vectors_deleted": vectors_deleted,
            "message": f"Deleted {vectors_deleted} vectors for document {document_id}"
        }
    except Exception as e:
        logger.error(f"Error deleting document {document_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Debug: List all collections and their counts
@app.get("/api/debug/collections")
async def debug_collections():
    """Debug endpoint: show all collections and their document counts"""
    try:
        stats = chroma_service.get_collection_stats()
        
        # Also try to get all RFP document IDs
        all_rfp = chroma_service.rfp_collection.get()
        rfp_doc_ids = set()
        if all_rfp and all_rfp.get("metadatas"):
            for meta in all_rfp.get("metadatas", []):
                if meta and "document_id" in meta:
                    rfp_doc_ids.add(meta["document_id"])
        
        return {
            "success": True,
            "collection_stats": stats,
            "rfp_document_ids_in_chromadb": sorted(list(rfp_doc_ids)),
            "total_unique_rfp_documents": len(rfp_doc_ids),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# =============================================================================
# Main Entry Point
# =============================================================================

if __name__ == "__main__":
    import uvicorn
    
    HOST = os.getenv("HOST", "0.0.0.0")
    PORT = int(os.getenv("PORT", "8005"))
    
    logger.info("="*60)
    logger.info("NHAI Historical Data Service")
    logger.info("="*60)
    logger.info(f"Starting on {HOST}:{PORT}")
    logger.info("="*60)
    
    uvicorn.run(
        app,
        host=HOST,
        port=PORT,
        log_level="info",
        reload=False
    )
