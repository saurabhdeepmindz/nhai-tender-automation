"""
NHAI RAG System - Screen 7: History Retriever Agent
Main FastAPI Server

This service provides:
- Document ingestion and vectorization
- Semantic search across historical data
- RAG configuration management
- Transaction tracking
- Integration with NestJS backend

Port: 8000
Author: NHAI Development Team
Date: January 2026
"""

import os
import sys
import logging
import uuid
import json
from datetime import datetime
from typing import List, Dict, Any, Optional
from pathlib import Path

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

# FastAPI imports
from fastapi import FastAPI, HTTPException, UploadFile, File, Form, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

# Add shared utilities to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'shared'))

# Import shared utilities
from embeddings import (
    create_embedding_generator,
    EmbeddingProvider,
    EmbeddingConfig,
    EmbeddingGenerator
)
from llm_utils import (
    create_llm_manager,
    LLMManager,
    PromptTemplateManager
)
# Import RAGAS evaluator
from ragas_evaluator import RAGASEvaluator

# ChromaDB for vector storage
import chromadb
from chromadb.config import Settings

# Document processing
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import (
    PyPDFLoader,
    Docx2txtLoader,
    TextLoader,
    CSVLoader
)

# Setup logging to both terminal and file
log_dir = os.path.join(os.path.dirname(__file__), 'logs')
os.makedirs(log_dir, exist_ok=True)
log_file = os.path.join(log_dir, 'history-retriever.log')

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

class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    service: str
    version: str
    timestamp: str
    vector_store: str
    embedding_provider: str
    llm_provider: str

class IngestDocumentRequest(BaseModel):
    """Request model for document ingestion"""
    document_id: str
    document_type: str = Field(..., description="rfp, qa, or corrigendum")
    file_path: str
    file_name: str
    rfp_number: Optional[str] = None
    title: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

class IngestDocumentResponse(BaseModel):
    """Response model for document ingestion"""
    success: bool
    document_id: str
    chunks_processed: int
    vector_store_id: str
    processing_time: float
    message: str

class SearchRequest(BaseModel):
    """Request model for semantic search"""
    query: str
    top_k: int = Field(default=5, ge=1, le=50)
    filter: Optional[Dict[str, Any]] = None
    document_type: Optional[str] = None
    rfp_number: Optional[str] = None

class SearchResult(BaseModel):
    """Individual search result"""
    document_id: str
    chunk_id: str
    content: str
    score: float
    metadata: Dict[str, Any]

class SearchResponse(BaseModel):
    """Response model for semantic search"""
    success: bool
    query: str
    results: List[SearchResult]
    execution_time: float
    total_results: int

class RAGConfig(BaseModel):
    """RAG configuration model"""
    embedding_provider: str = os.getenv("EMBEDDING_PROVIDER", "ollama")
    embedding_model: str = os.getenv(
        "OLLAMA_EMBEDDING_MODEL" if os.getenv("EMBEDDING_PROVIDER", "ollama") == "ollama" 
        else "OPENAI_EMBEDDING_MODEL", 
        "nomic-embed-text"
    )
    llm_provider: str = os.getenv("LLM_PROVIDER", "ollama")
    llm_model: str = os.getenv(
        "OLLAMA_LLM_MODEL" if os.getenv("LLM_PROVIDER", "ollama") == "ollama"
        else "OPENAI_LLM_MODEL",
        "gemma3:1b"
    )
    chunk_size: int = int(os.getenv("CHUNK_SIZE", "1000"))
    chunk_overlap: int = int(os.getenv("CHUNK_OVERLAP", "200"))
    top_k: int = int(os.getenv("TOP_K", "5"))
    vector_store_type: str = os.getenv("VECTOR_STORE", "chromadb")
    enable_cache: bool = os.getenv("ENABLE_CACHE", "true").lower() == "true"
    ollama_base_url: str = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")

class Transaction(BaseModel):
    """Transaction tracking model"""
    transaction_id: str
    operation: str
    document_id: Optional[str] = None
    status: str
    timestamp: str
    execution_time: Optional[float] = None
    details: Optional[Dict[str, Any]] = None

class StatisticsResponse(BaseModel):
    """Statistics response model"""
    total_documents: int
    total_chunks: int
    total_searches: int
    total_transactions: int
    vector_store_size_mb: float
    uptime_seconds: float


# =============================================================================
# Global Variables & Async Queue
# =============================================================================


import threading
import queue

app = FastAPI(
    title="NHAI History Retriever Agent",
    description="Screen 7 - Historical Data RAG Service",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Global state
embedding_generator: Optional[EmbeddingGenerator] = None
llm_manager: Optional[LLMManager] = None
chroma_client: Optional[chromadb.Client] = None
collection = None
config: RAGConfig = RAGConfig()
transactions: List[Transaction] = []
start_time = datetime.now()

# Storage directories
UPLOAD_DIR = Path("./uploads")
CHROMA_DIR = Path("./chroma_db")
UPLOAD_DIR.mkdir(exist_ok=True)
CHROMA_DIR.mkdir(exist_ok=True)

# Statistics
stats = {
    "total_documents": 0,
    "total_chunks": 0,
    "total_searches": 0,
    "total_transactions": 0
}

# --- Simple In-Memory Async Queue for Demo ---
ingest_queue = queue.Queue()
search_queue = queue.Queue()
processing_status = {}  # key: job_id, value: dict with status, result, etc.

def background_ingest_worker():
    while True:
        job = ingest_queue.get()
        if job is None:
            break
        job_id = job['job_id']
        logger.info(f"[QUEUE] Ingest job dequeued: {job_id}")
        try:
            processing_status[job_id]['status'] = 'processing'
            logger.info(f"[QUEUE] Ingest job {job_id} processing started")
            response = _process_ingest_document(**job['params'])
            processing_status[job_id]['status'] = 'completed'
            processing_status[job_id]['result'] = response
            logger.info(f"[QUEUE] Ingest job {job_id} completed successfully")
        except Exception as e:
            processing_status[job_id]['status'] = 'failed'
            processing_status[job_id]['error'] = str(e)
            logger.error(f"[QUEUE] Ingest job {job_id} failed: {str(e)}")
        ingest_queue.task_done()

def background_search_worker():
    while True:
        job = search_queue.get()
        if job is None:
            break
        job_id = job['job_id']
        logger.info(f"[QUEUE] Search job dequeued: {job_id}")
        try:
            processing_status[job_id]['status'] = 'processing'
            logger.info(f"[QUEUE] Search job {job_id} processing started")
            response = _process_search_documents(**job['params'])
            processing_status[job_id]['status'] = 'completed'
            processing_status[job_id]['result'] = response
            logger.info(f"[QUEUE] Search job {job_id} completed successfully")
        except Exception as e:
            processing_status[job_id]['status'] = 'failed'
            processing_status[job_id]['error'] = str(e)
            logger.error(f"[QUEUE] Search job {job_id} failed: {str(e)}")
        search_queue.task_done()

# Start background workers
threading.Thread(target=background_ingest_worker, daemon=True).start()
threading.Thread(target=background_search_worker, daemon=True).start()

# =============================================================================
# Initialization Functions
# =============================================================================

def initialize_services():
    """Initialize embedding generator, LLM, and vector store"""
    global embedding_generator, llm_manager, chroma_client, collection
    
    try:
        logger.info("Initializing services...")
        
        # Initialize embedding generator
        embedding_config = EmbeddingConfig(
            provider=EmbeddingProvider.OPENAI if config.embedding_provider == "openai" else EmbeddingProvider.OLLAMA,
            model=config.embedding_model,
            api_key=os.getenv("OPENAI_API_KEY") if config.embedding_provider == "openai" else None,
            base_url=config.ollama_base_url if config.embedding_provider == "ollama" else None,
            cache_enabled=config.enable_cache,
            batch_size=100
        )
        embedding_generator = EmbeddingGenerator(embedding_config)
        logger.info(f"✓ Embedding generator initialized: {config.embedding_provider}/{config.embedding_model}")
        
        # Initialize LLM manager
        llm_manager = create_llm_manager(
            provider=config.llm_provider,
            model=config.llm_model,
            temperature=0.7,
            base_url=config.ollama_base_url if config.llm_provider == "ollama" else None
        )
        logger.info(f"✓ LLM manager initialized: {config.llm_provider}/{config.llm_model}")
        
        # Initialize ChromaDB
        chroma_client = chromadb.PersistentClient(
            path=str(CHROMA_DIR),
            settings=Settings(
                anonymized_telemetry=False,
                allow_reset=True
            )
        )
        
        # Create or get collection
        try:
            collection = chroma_client.get_collection(name="nhai_historical_data")
            logger.info(f"✓ Connected to existing collection: {collection.count()} documents")
        except:
            collection = chroma_client.create_collection(
                name="nhai_historical_data",
                metadata={"description": "NHAI Historical RFPs, Q&A, and Corrigenda"}
            )
            logger.info("✓ Created new ChromaDB collection")
        
        logger.info("✅ All services initialized successfully")
        return True
        
    except Exception as e:
        logger.error(f"❌ Failed to initialize services: {str(e)}")
        raise

# =============================================================================
# Utility Functions
# =============================================================================

def load_document(file_path: str) -> List[str]:
    """Load and extract text from various document formats"""
    file_ext = Path(file_path).suffix.lower()
    
    try:
        if file_ext == '.pdf':
            loader = PyPDFLoader(file_path)
        elif file_ext in ['.docx', '.doc']:
            loader = Docx2txtLoader(file_path)
        elif file_ext == '.txt':
            loader = TextLoader(file_path)
        elif file_ext == '.csv':
            loader = CSVLoader(file_path)
        else:
            raise ValueError(f"Unsupported file format: {file_ext}")
        
        documents = loader.load()
        text_content = [doc.page_content for doc in documents]
        
        logger.info(f"Loaded {len(text_content)} pages from {file_path}")
        return text_content
        
    except Exception as e:
        logger.error(f"Error loading document {file_path}: {str(e)}")
        raise

def chunk_text(text: str) -> List[str]:
    """Split text into chunks for vectorization"""
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=config.chunk_size,
        chunk_overlap=config.chunk_overlap,
        length_function=len,
        separators=["\n\n", "\n", ". ", " ", ""]
    )
    
    chunks = text_splitter.split_text(text)
    logger.info(f"Split text into {len(chunks)} chunks")
    return chunks

def create_transaction(operation: str, document_id: Optional[str] = None, 
                      status: str = "pending", details: Optional[Dict] = None) -> Transaction:
    """Create and track a transaction"""
    transaction = Transaction(
        transaction_id=str(uuid.uuid4()),
        operation=operation,
        document_id=document_id,
        status=status,
        timestamp=datetime.now().isoformat(),
        details=details
    )
    
    transactions.append(transaction)
    stats["total_transactions"] += 1
    
    return transaction

def update_transaction(transaction: Transaction, status: str, 
                      execution_time: Optional[float] = None, 
                      details: Optional[Dict] = None):
    """Update transaction status"""
    transaction.status = status
    if execution_time is not None:
        transaction.execution_time = execution_time
    if details is not None:
        transaction.details = details

# =============================================================================
# API Endpoints
# =============================================================================

@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    logger.info("="*60)
    logger.info("Starting NHAI History Retriever Agent (Screen 7)")
    logger.info("="*60)
    initialize_services()

@app.get("/", response_model=Dict[str, str])
async def root():
    """Root endpoint"""
    return {
        "service": "NHAI History Retriever Agent",
        "version": "1.0.0",
        "status": "running",
        "port": "8000"
    }

@app.get("/api/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return HealthResponse(
        status="healthy",
        service="History Retriever Agent",
        version="1.0.0",
        timestamp=datetime.now().isoformat(),
        vector_store="chromadb" if collection else "not initialized",
        embedding_provider=config.embedding_provider,
        llm_provider=config.llm_provider
    )


# --- Internal sync ingest logic for background worker ---
def _process_ingest_document(document_id, document_type, file_path, file_name, rfp_number=None, title=None, metadata=None):
    start_time_ingest = datetime.now()
    transaction = create_transaction("ingest", document_id)
    try:
        logger.info(f"[QUEUE] Ingesting document: {document_id}")
        doc_metadata = json.loads(metadata) if metadata else {}
        doc_metadata.update({
            "document_id": document_id,
            "document_type": document_type,
            "file_name": file_name,
            "rfp_number": rfp_number or "unknown",
            "title": title or file_name,
            "ingested_at": datetime.now().isoformat()
        })
        text_pages = load_document(file_path)
        full_text = "\n\n".join(text_pages)
        chunks = chunk_text(full_text)
        logger.info(f"[QUEUE] Created {len(chunks)} chunks")
        embeddings = embedding_generator.embed_documents(chunks)
        chunk_ids = [f"{document_id}_chunk_{i}" for i in range(len(chunks))]
        chunk_metadatas = []
        for i, chunk in enumerate(chunks):
            chunk_meta = doc_metadata.copy()
            chunk_meta.update({
                "chunk_id": i,
                "chunk_total": len(chunks),
                "chunk_text_preview": chunk[:100]
            })
            chunk_metadatas.append(chunk_meta)
        collection.add(
            ids=chunk_ids,
            embeddings=embeddings,
            documents=chunks,
            metadatas=chunk_metadatas
        )
        stats["total_documents"] += 1
        stats["total_chunks"] += len(chunks)
        processing_time = (datetime.now() - start_time_ingest).total_seconds()
        update_transaction(
            transaction,
            status="completed",
            execution_time=processing_time,
            details={
                "chunks_processed": len(chunks),
                "embeddings_generated": len(embeddings)
            }
        )
        logger.info(f"[QUEUE] ✅ Document {document_id} ingested in {processing_time:.2f}s")
        return {
            "success": True,
            "document_id": document_id,
            "chunks_processed": len(chunks),
            "vector_store_id": document_id,
            "processing_time": processing_time,
            "message": f"Document ingested successfully with {len(chunks)} chunks"
        }
    except Exception as e:
        logger.error(f"[QUEUE] ❌ Error ingesting document {document_id}: {str(e)}")
        update_transaction(transaction, status="failed", details={"error": str(e)})
        raise

@app.post("/api/rag/ingest/sync")
async def ingest_document_sync(
    document_id: str = Form(...),
    document_type: str = Form(...),
    file_path: str = Form(...),
    file_name: str = Form(...),
    rfp_number: Optional[str] = Form(None),
    title: Optional[str] = Form(None),
    metadata: Optional[str] = Form(None)
):
    """
    Synchronous document ingestion - processes file inline and returns immediately
    Used for test/demo data population
    """
    try:
        start_time = datetime.now()
        
        logger.info(f"[SYNC INGEST] Processing: {file_name} (RFP: {rfp_number})")
        
        # Validate file exists
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"File not found: {file_path}")
        
        # Initialize components if needed
        if not hasattr(ingest_document_sync, '_text_splitter'):
            ingest_document_sync._text_splitter = RecursiveCharacterTextSplitter(
                chunk_size=int(os.getenv("CHUNK_SIZE", "1000")),
                chunk_overlap=int(os.getenv("CHUNK_OVERLAP", "200"))
            )
        
        # Load document
        if file_name.endswith('.pdf'):
            loader = PyPDFLoader(file_path)
        elif file_name.endswith('.docx'):
            loader = Docx2txtLoader(file_path)
        elif file_name.endswith('.csv'):
            loader = CSVLoader(file_path)
        else:  # .txt
            loader = TextLoader(file_path)
        
        pages = loader.load()
        text = "\n".join([page.page_content for page in pages])
        
        # Split into chunks
        chunks = ingest_document_sync._text_splitter.split_text(text)
        
        # Generate embeddings and insert into ChromaDB
        chroma_client = chromadb.PersistentClient(
            path=str(CHROMA_DIR),
            settings=Settings(
                anonymized_telemetry=False,
                allow_reset=True
            )
        )
        
        collection = chroma_client.get_collection(name="nhai_historical_data")
        
        vector_ids = []
        for i, chunk in enumerate(chunks):
            chunk_id = f"{document_id}_chunk_{i}"
            embedding = embedding_generator.embed_query(chunk)
            
            collection.add(
                ids=[chunk_id],
                embeddings=[embedding],
                documents=[chunk],
                metadatas=[{
                    "document_id": str(document_id),
                    "document_type": document_type,
                    "rfp_number": rfp_number or "N/A",
                    "title": title or file_name,
                    "chunk_index": i,
                    "file_name": file_name,
                    **(json.loads(metadata) if metadata else {})
                }]
            )
            vector_ids.append(chunk_id)
        
        processing_time = (datetime.now() - start_time).total_seconds()
        
        logger.info(f"[SYNC INGEST] ✓ Indexed {len(chunks)} chunks in {processing_time:.2f}s")
        
        return {
            "success": True,
            "document_id": document_id,
            "file_name": file_name,
            "chunks_processed": len(chunks),
            "vector_ids": vector_ids,
            "processing_time": processing_time,
            "message": f"Successfully indexed {len(chunks)} chunks"
        }
        
    except Exception as e:
        logger.error(f"[SYNC INGEST] ✗ Error: {str(e)}", exc_info=True)
        return {
            "success": False,
            "document_id": document_id,
            "error": str(e),
            "message": f"Failed to ingest document: {str(e)}"
        }

@app.post("/api/rag/ingest")
async def ingest_document_async(
    background_tasks: BackgroundTasks,
    document_id: str = Form(...),
    document_type: str = Form(...),
    file_path: str = Form(...),
    file_name: str = Form(...),
    rfp_number: Optional[str] = Form(None),
    title: Optional[str] = Form(None),
    metadata: Optional[str] = Form(None)
):
    """
    Async: Queue the document for ingestion, return job_id, queue position, and ETA for status polling
    """
    job_id = str(uuid.uuid4())
    # Estimate queue position and ETA
    queue_pos = ingest_queue.qsize() + 1
    avg_time = 5  # seconds, adjust as needed for your workload
    eta = avg_time * queue_pos
    processing_status[job_id] = {"status": "queued", "queue_position": queue_pos, "eta_seconds": eta}
    ingest_queue.put({
        "job_id": job_id,
        "params": {
            "document_id": document_id,
            "document_type": document_type,
            "file_path": file_path,
            "file_name": file_name,
            "rfp_number": rfp_number,
            "title": title,
            "metadata": metadata
        }
    })
    return {"job_id": job_id, "status": "queued", "queue_position": queue_pos, "eta_seconds": eta}



# --- Internal sync search logic for background worker ---
def _process_search_documents(request: SearchRequest):
    start_time_search = datetime.now()
    transaction = create_transaction("search", details={"query": request.query})
    try:
        logger.info(f"[QUEUE] Searching for: {request.query}")
        query_embedding = embedding_generator.embed_query(request.query)
        where_filter = None
        if request.document_type:
            where_filter = {"document_type": request.document_type}
        if request.rfp_number:
            where_filter = where_filter or {}
            where_filter["rfp_number"] = request.rfp_number
        search_results = collection.query(
            query_embeddings=[query_embedding],
            n_results=request.top_k,
            where=where_filter
        )
        results = []
        if search_results['ids'] and len(search_results['ids'][0]) > 0:
            for i, chunk_id in enumerate(search_results['ids'][0]):
                result = SearchResult(
                    document_id=search_results['metadatas'][0][i].get('document_id', 'unknown'),
                    chunk_id=chunk_id,
                    content=search_results['documents'][0][i],
                    score=float(search_results['distances'][0][i]) if 'distances' in search_results else 1.0,
                    metadata=search_results['metadatas'][0][i]
                )
                results.append(result)
        logger.info(f"[QUEUE] Number of search results: {len(results)}")
        # --- RAGAS Evaluation (Top Result Only) ---
        try:
            logger.info("[QUEUE] Before RAGAS evaluation block")
            if results:
                logger.info(f"[QUEUE] Preparing to evaluate RAGAS for top result. Query: {request.query[:100]} | Answer: {results[0].content[:100]}")
                ragas_eval = RAGASEvaluator(log_results=True)
                ragas_scores = ragas_eval._evaluate_sync(
                    ragas_eval._prepare_dataset(
                        question=request.query,
                        answer=results[0].content,
                        contexts=[results[0].content]
                    )
                )
                logger.info(f"[QUEUE] RAGAS (top result): faithfulness={ragas_scores.get('faithfulness')}, answer_relevancy={ragas_scores.get('answer_relevancy')}, eval_time_ms={ragas_scores.get('evaluation_time_ms')}")
            logger.info("[QUEUE] After RAGAS evaluation block")
        except Exception as eval_exc:
            logger.warning(f"[QUEUE] RAGAS evaluation failed: {eval_exc}")
        stats["total_searches"] += 1
        execution_time = (datetime.now() - start_time_search).total_seconds()
        update_transaction(
            transaction,
            status="completed",
            execution_time=execution_time,
            details={"results_count": len(results)}
        )
        logger.info(f"[QUEUE] ✅ Search completed: {len(results)} results in {execution_time:.2f}s")
        return {
            "success": True,
            "query": request.query,
            "results": [r.dict() for r in results],
            "execution_time": execution_time,
            "total_results": len(results)
        }
    except Exception as e:
        logger.error(f"[QUEUE] ❌ Error searching documents: {str(e)}")
        update_transaction(transaction, status="failed", details={"error": str(e)})
        raise

@app.post("/api/rag/search/sync")
async def search_documents_sync(request: SearchRequest):
    """
    Synchronous search endpoint for real-time results (used by Chief Engineer)
    Performs search inline without queuing for immediate response
    """
    try:
        start_time = datetime.now()
        
        # Use the global embedding generator that's already initialized
        query_embedding = embedding_generator.embed_query(request.query)
        
        # Get ChromaDB collection
        chroma_client = chromadb.PersistentClient(
            path=str(CHROMA_DIR),
            settings=Settings(
                anonymized_telemetry=False,
                allow_reset=True
            )
        )
        
        collection = chroma_client.get_collection(name="nhai_historical_data")
        
        # Perform search
        search_results = collection.query(
            query_embeddings=[query_embedding],
            n_results=request.top_k,
            include=["embeddings", "documents", "metadatas", "distances"]
        )
        
        # Format results
        results = []
        if search_results and search_results.get("ids"):
            for i, doc_id in enumerate(search_results["ids"][0]):
                similarity_score = 1 - (float(search_results["distances"][0][i]) / 2) if search_results.get("distances") else 0
                result = {
                    "document_id": doc_id,
                    "chunk_text": search_results["documents"][0][i] if search_results.get("documents") else "",
                    "similarity_score": similarity_score,
                    "metadata": search_results["metadatas"][0][i] if search_results.get("metadatas") else {},
                }
                results.append(result)
        
        processing_time = (datetime.now() - start_time).total_seconds()
        
        logger.info(f"Synchronous search found {len(results)} results in {processing_time:.2f}s")
        
        return {
            "success": True,
            "results": results,
            "query": request.query,
            "top_k": request.top_k,
            "processing_time": processing_time,
            "count": len(results)
        }
        
    except Exception as e:
        logger.error(f"Synchronous search failed: {str(e)}", exc_info=True)
        return {
            "success": False,
            "results": [],
            "error": str(e),
            "query": request.query
        }

@app.post("/api/rag/search")
async def search_documents_async(request: SearchRequest):
    """
    Async: Queue the search request, return job_id, queue position, and ETA for status polling
    """
    job_id = str(uuid.uuid4())
    queue_pos = search_queue.qsize() + 1
    avg_time = 3  # seconds, adjust as needed for your workload
    eta = avg_time * queue_pos
    processing_status[job_id] = {"status": "queued", "queue_position": queue_pos, "eta_seconds": eta}
    search_queue.put({
        "job_id": job_id,
        "params": {"request": request}
    })
    return {"job_id": job_id, "status": "queued", "queue_position": queue_pos, "eta_seconds": eta}
# =============================================================================
# API Endpoints
# =============================================================================

# --- Status Endpoint for Async Jobs ---
@app.get("/api/rag/job-status/{job_id}")
async def get_job_status(job_id: str):
    """
    Get the status/result of an async ingest/search job, including queue position and ETA if queued
    """
    status = processing_status.get(job_id)
    if not status:
        return {"job_id": job_id, "status": "not_found"}
    # If still queued, update queue position and ETA
    if status["status"] == "queued":
        # Determine if job is in ingest or search queue
        if job_id in [j['job_id'] for j in list(ingest_queue.queue)]:
            queue_pos = [j['job_id'] for j in list(ingest_queue.queue)].index(job_id) + 1
            avg_time = 5
            status["queue_position"] = queue_pos
            status["eta_seconds"] = avg_time * queue_pos
        elif job_id in [j['job_id'] for j in list(search_queue.queue)]:
            queue_pos = [j['job_id'] for j in list(search_queue.queue)].index(job_id) + 1
            avg_time = 3
            status["queue_position"] = queue_pos
            status["eta_seconds"] = avg_time * queue_pos
    return {"job_id": job_id, **status}

@app.get("/api/rag/config", response_model=RAGConfig)
async def get_config():
    """Get current RAG configuration"""
    return config

@app.put("/api/rag/config", response_model=RAGConfig)
async def update_config(new_config: RAGConfig):
    """Update RAG configuration"""
    global config, embedding_generator
    
    try:
        logger.info("Updating RAG configuration...")
        
        # Update config
        old_config = config
        config = new_config
        
        # Reinitialize if embedding settings changed
        if (old_config.embedding_provider != new_config.embedding_provider or
            old_config.embedding_model != new_config.embedding_model):
            logger.info("Reinitializing embedding generator...")
            embedding_config = EmbeddingConfig(
                provider=EmbeddingProvider.OPENAI if config.embedding_provider == "openai" else EmbeddingProvider.OLLAMA,
                model=config.embedding_model,
                api_key=os.getenv("OPENAI_API_KEY") if config.embedding_provider == "openai" else None,
                base_url=config.ollama_base_url if config.embedding_provider == "ollama" else None,
                cache_enabled=config.enable_cache
            )
            embedding_generator = EmbeddingGenerator(embedding_config)
            logger.info("✓ Embedding generator reinitialized")
        
        logger.info("✅ Configuration updated successfully")
        return config
        
    except Exception as e:
        logger.error(f"❌ Error updating configuration: {str(e)}")
        config = old_config  # Rollback
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/rag/transactions", response_model=List[Transaction])
async def get_transactions(
    limit: int = 50,
    operation: Optional[str] = None,
    status: Optional[str] = None
):
    """Get transaction history"""
    filtered_transactions = transactions
    
    if operation:
        filtered_transactions = [t for t in filtered_transactions if t.operation == operation]
    
    if status:
        filtered_transactions = [t for t in filtered_transactions if t.status == status]
    
    # Return latest first
    filtered_transactions = sorted(
        filtered_transactions,
        key=lambda x: x.timestamp,
        reverse=True
    )
    
    return filtered_transactions[:limit]

@app.get("/api/statistics", response_model=StatisticsResponse)
async def get_statistics():
    """Get service statistics"""
    # Calculate uptime
    uptime = (datetime.now() - start_time).total_seconds()
    
    # Estimate vector store size
    vector_store_size = 0
    if CHROMA_DIR.exists():
        for file in CHROMA_DIR.rglob('*'):
            if file.is_file():
                vector_store_size += file.stat().st_size
    vector_store_size_mb = vector_store_size / (1024 * 1024)
    
    return StatisticsResponse(
        total_documents=stats["total_documents"],
        total_chunks=stats["total_chunks"],
        total_searches=stats["total_searches"],
        total_transactions=stats["total_transactions"],
        vector_store_size_mb=round(vector_store_size_mb, 2),
        uptime_seconds=round(uptime, 2)
    )

@app.delete("/api/rag/documents/{document_id}")
async def delete_document(document_id: str):
    """Delete a document and its chunks from vector store"""
    transaction = create_transaction("delete", document_id)
    
    try:
        logger.info(f"Deleting document: {document_id}")
        
        # Get all chunks for this document
        results = collection.get(
            where={"document_id": document_id}
        )
        
        if not results['ids']:
            raise HTTPException(status_code=404, detail="Document not found")
        
        chunk_ids = results['ids']
        
        # Delete from ChromaDB
        collection.delete(ids=chunk_ids)
        
        # Update statistics
        stats["total_chunks"] -= len(chunk_ids)
        stats["total_documents"] -= 1
        
        # Update transaction
        update_transaction(
            transaction,
            status="completed",
            details={"chunks_deleted": len(chunk_ids)}
        )
        
        logger.info(f"✅ Deleted document {document_id} with {len(chunk_ids)} chunks")
        
        return {
            "success": True,
            "document_id": document_id,
            "chunks_deleted": len(chunk_ids),
            "message": "Document deleted successfully"
        }
        
    except Exception as e:
        logger.error(f"❌ Error deleting document {document_id}: {str(e)}")
        update_transaction(transaction, status="failed", details={"error": str(e)})
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/rag/reprocess/{document_id}")
async def reprocess_document(document_id: str):
    """Reprocess a document (delete and re-ingest)"""
    try:
        # This would require the original file path
        # For now, return not implemented
        return {
            "success": False,
            "message": "Reprocessing requires re-upload from backend"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# =============================================================================
# Main Entry Point
# =============================================================================

if __name__ == "__main__":
    import uvicorn
    
    # Configuration
    HOST = os.getenv("HOST", "0.0.0.0")
    PORT = int(os.getenv("PORT", "8000"))
    
    logger.info("="*60)
    logger.info("NHAI History Retriever Agent - Screen 7")
    logger.info("="*60)
    logger.info(f"Starting server on {HOST}:{PORT}")
    logger.info("="*60)
    
    uvicorn.run(
        app,
        host=HOST,
        port=PORT,
        log_level="info",
        reload=False  # Set to True for development
    )
