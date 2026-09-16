"""
NHAI RAG System - Screen 8: Chief Engineer Agent
Main FastAPI Server

This service provides:
- Vendor query processing with 6-step workflow
- AI-powered response generation
- Similar query search
- Workflow execution tracking
- Integration with NestJS backend

Port: 8001
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
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# FastAPI imports
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

# ChromaDB import
import chromadb
from chromadb.config import Settings

# Add shared utilities to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'shared'))

# Import shared utilities
from embeddings import (
    create_embedding_generator,
    EmbeddingProvider,
    EmbeddingGenerator
)
from llm_utils import (
    create_llm_manager,
    LLMManager,
    LLMProvider,
    PromptTemplateManager
)

# Import local modules
from chief_engineer_agent import ChiefEngineerAgent
from workflow_manager_pg import WorkflowManager
from database import init_database, close_database, get_database

# Setup logging to both terminal and file
log_dir = os.path.join(os.path.dirname(__file__), 'logs')
os.makedirs(log_dir, exist_ok=True)
log_file = os.path.join(log_dir, 'chief-engineer.log')

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
    workflow_engine: str
    embedding_provider: str
    llm_provider: str

class ProcessQueryRequest(BaseModel):
    """Request model for query processing"""
    query_id: str
    query_text: str = Field(..., min_length=1)
    rfp_context: Optional[Dict[str, Any]] = None
    rfp_id: Optional[str] = None
    category: Optional[str] = None
    use_historical_data: bool = True
    search_similar_queries: bool = True
    top_k: int = Field(default=5, ge=1, le=20)
    min_confidence: float = Field(default=0.7, ge=0.0, le=1.0)

class ResponseData(BaseModel):
    """AI-generated response data"""
    ai_response: str
    past_ref_response: Optional[str] = None
    past_response: Optional[str] = None
    confidence: float
    source_documents: List[str]
    execution_id: str
    workflow_steps: List[Dict[str, Any]]
    processing_time: float

class ProcessQueryResponse(BaseModel):
    """Response model for query processing"""
    success: bool
    query_id: str
    execution_id: str
    response: ResponseData
    message: str

class SimilarQuery(BaseModel):
    """Similar query result"""
    query_id: str
    query_text: str
    response_text: str
    similarity_score: float
    rfp_number: Optional[str] = None
    category: Optional[str] = None
    answered_at: Optional[str] = None

class StoreQueryRequest(BaseModel):
    """Request for storing query in vector database"""
    query_id: str
    query_text: str
    category: str
    rfp_number: str
    metadata: Dict[str, Any]

class StoreQueryResponse(BaseModel):
    """Response for storing query"""
    success: bool
    query_id: str
    message: str
    embedding_dimension: Optional[int] = None
    processing_time: Optional[float] = None

class SimilarQueriesRequest(BaseModel):
    """Request for similar queries"""
    query_text: str
    top_k: int = Field(default=5, ge=1, le=20)
    rfp_id: Optional[str] = None
    category: Optional[str] = None

class SimilarQueriesResponse(BaseModel):
    """Response for similar queries"""
    success: bool
    query: str
    similar_queries: List[SimilarQuery]
    execution_time: float

class WorkflowExecutionResponse(BaseModel):
    """Workflow execution details"""
    execution_id: str
    query_id: str
    status: str
    steps: List[Dict[str, Any]]
    total_duration: float
    created_at: str
    completed_at: Optional[str] = None

class StatisticsResponse(BaseModel):
    """Statistics response"""
    total_queries_processed: int
    total_workflows_executed: int
    average_processing_time: float
    average_confidence_score: float
    success_rate: float
    uptime_seconds: float

# =============================================================================
# Global Variables
# =============================================================================

app = FastAPI(
    title="NHAI Chief Engineer Agent",
    description="Screen 8 - Pre-bid Query Management RAG Service",
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
chief_engineer: Optional[ChiefEngineerAgent] = None
workflow_manager: Optional[WorkflowManager] = None
start_time = datetime.now()

# Configuration tracking
current_config = {
    "embedding_provider": None,
    "llm_provider": None,
    "embedding_model": None,
    "llm_model": None
}

# Statistics
stats = {
    "total_queries_processed": 0,
    "total_workflows_executed": 0,
    "total_processing_time": 0.0,
    "total_confidence": 0.0,
    "successful_queries": 0,
    "failed_queries": 0
}

# =============================================================================
# Initialization Functions
# =============================================================================

def initialize_services():
    """Initialize all services"""
    global embedding_generator, llm_manager, chief_engineer, workflow_manager
    
    try:
        logger.info("Initializing services...")
        
        # Load provider configuration from environment
        embedding_provider = os.getenv("EMBEDDING_PROVIDER", "ollama").lower()
        llm_provider = os.getenv("LLM_PROVIDER", "ollama").lower()
        
        # Ollama configuration
        ollama_base_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
        ollama_embedding_model = os.getenv("OLLAMA_EMBEDDING_MODEL", "nomic-embed-text")
        ollama_llm_model = os.getenv("OLLAMA_LLM_MODEL", "gemma3:1b")
        
        # OpenAI configuration
        openai_api_key = os.getenv("OPENAI_API_KEY")
        openai_embedding_model = os.getenv("OPENAI_EMBEDDING_MODEL", "text-embedding-3-small")
        openai_llm_model = os.getenv("OPENAI_LLM_MODEL", "gpt-4o-mini")
        
        enable_cache = os.getenv("ENABLE_CACHE", "true").lower() == "true"
        
        # Initialize embedding generator based on provider
        if embedding_provider == "openai":
            if not openai_api_key:
                raise ValueError("OPENAI_API_KEY not set in environment. Please add it to .env file.")
            embedding_generator = create_embedding_generator(
                provider=EmbeddingProvider.OPENAI,
                model=openai_embedding_model,
                api_key=openai_api_key,
                cache_enabled=enable_cache
            )
            logger.info(f"✓ Embedding generator initialized: openai/{openai_embedding_model}")
        else:  # ollama
            embedding_generator = create_embedding_generator(
                provider=EmbeddingProvider.OLLAMA,
                model=ollama_embedding_model,
                base_url=ollama_base_url,
                cache_enabled=enable_cache
            )
            logger.info(f"✓ Embedding generator initialized: ollama/{ollama_embedding_model}")
        
        # Initialize LLM manager based on provider
        if llm_provider == "openai":
            if not openai_api_key:
                raise ValueError("OPENAI_API_KEY not set in environment. Please add it to .env file.")
            llm_manager = create_llm_manager(
                provider=LLMProvider.OPENAI,
                model=openai_llm_model,
                api_key=openai_api_key,
                temperature=0.7,
                max_tokens=2000
            )
            logger.info(f"✓ LLM manager initialized: openai/{openai_llm_model}")
        else:  # ollama
            llm_manager = create_llm_manager(
                provider=LLMProvider.OLLAMA,
                model=ollama_llm_model,
                base_url=ollama_base_url,
                temperature=0.7,
                max_tokens=2000
            )
            logger.info(f"✓ LLM manager initialized: ollama/{ollama_llm_model}")
        
        # Track current configuration
        current_config["embedding_provider"] = embedding_provider
        current_config["llm_provider"] = llm_provider
        current_config["embedding_model"] = openai_embedding_model if embedding_provider == "openai" else ollama_embedding_model
        current_config["llm_model"] = openai_llm_model if llm_provider == "openai" else ollama_llm_model
        
        # Initialize ChromaDB for query storage
        chroma_persist_directory = os.getenv("CHROMA_PERSIST_DIRECTORY", "./query_db")
        chroma_client = chromadb.PersistentClient(
            path=chroma_persist_directory,
            settings=Settings(
                anonymized_telemetry=False,
                allow_reset=True
            )
        )
        logger.info(f"✓ ChromaDB client initialized: {chroma_persist_directory}")
        
        # Initialize workflow manager
        workflow_manager = WorkflowManager()
        logger.info("✓ Workflow manager initialized")
        
        # Get Screen 7 URL from environment
        screen7_url = os.getenv("HISTORY_RETRIEVER_URL", "http://localhost:8000")
        
        # Initialize Chief Engineer Agent
        chief_engineer = ChiefEngineerAgent(
            screen7_url=screen7_url,
            workflow_manager=workflow_manager,
            embedding_generator=embedding_generator,  # Pass embedding generator for similarity search
            llm_manager=llm_manager  # Respects LLM_PROVIDER=openai|ollama
        )
        
        # Add query_collection to chief_engineer for /store-query endpoint
        chief_engineer.query_collection = chroma_client.get_or_create_collection(
            name="vendor_queries",
            metadata={
                "description": "Vector database for vendor query storage",
                "hnsw:space": "cosine"  # Use cosine similarity (CRITICAL!)
            }
        )
        logger.info("✓ Chief Engineer Agent initialized")
        logger.info(f"  Connected to Screen 7: {screen7_url}")
        logger.info(f"  Query collection: vendor_queries (cosine similarity)")
        
        logger.info("✅ All services initialized successfully")
        return True
        
    except Exception as e:
        logger.error(f"❌ Failed to initialize services: {str(e)}")
        raise

# =============================================================================
# API Endpoints
# =============================================================================

@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    logger.info("="*60)
    logger.info("Starting NHAI Chief Engineer Agent (Screen 8)")
    logger.info("="*60)
    
    # Initialize PostgreSQL database connection pool
    logger.info("Initializing PostgreSQL connection pool...")
    await init_database()
    logger.info("✓ PostgreSQL connection pool initialized")
    
    # Get database pool
    db_pool = get_database()
    
    # Initialize services
    initialize_services()
    
    # Set database pool for workflow manager
    if workflow_manager and db_pool:
        workflow_manager.set_db_pool(db_pool)
        logger.info("✓ Workflow manager configured with PostgreSQL persistence")
    else:
        logger.warning("⚠️  Workflow manager or database pool not available")

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup services on shutdown"""
    logger.info("="*60)
    logger.info("Shutting down NHAI Chief Engineer Agent (Screen 8)")
    logger.info("="*60)
    
    # Close PostgreSQL database connection pool
    logger.info("Closing PostgreSQL connection pool...")
    await close_database()
    logger.info("✓ PostgreSQL connection pool closed")
    
    logger.info("✅ Shutdown complete")

@app.get("/", response_model=Dict[str, str])
async def root():
    """Root endpoint"""
    return {
        "service": "NHAI Chief Engineer Agent",
        "version": "1.0.0",
        "status": "running",
        "port": "8001"
    }

@app.get("/api/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return HealthResponse(
        status="healthy",
        service="Chief Engineer Agent",
        version="1.0.0",
        timestamp=datetime.now().isoformat(),
        workflow_engine="active" if workflow_manager else "not initialized",
        embedding_provider=current_config.get("embedding_provider", "unknown"),
        llm_provider=current_config.get("llm_provider", "unknown")
    )

@app.post("/api/chief-engineer/store-query", response_model=StoreQueryResponse)
async def store_query(request: StoreQueryRequest):
    """
    Store vendor query in ChromaDB for future similar query search
    
    Called by NestJS backend (QueryVectorizationJob) to store query embeddings
    
    This enables:
    - Finding similar past queries when processing new queries
    - Building a knowledge base of vendor queries
    - Improving AI response accuracy over time
    """
    start_time = datetime.now()
    
    try:
        logger.info(f"Storing query {request.query_id} in vector database")
        logger.info(f"Query text: {request.query_text[:100]}...")
        
        # Generate embedding for query text
        embedding = embedding_generator.embed_query(text=request.query_text)
        embedding_dimension = len(embedding)
        
        logger.info(f"Generated embedding with dimension: {embedding_dimension}")
        
        # Prepare metadata
        metadata = {
            "query_id": request.query_id,
            "category": request.category,
            "rfp_number": request.rfp_number,
            "submitted_by": request.metadata.get("submitted_by", "unknown"),
            "submitted_at": request.metadata.get("submitted_at", datetime.now().isoformat()),
            "priority": request.metadata.get("priority", "normal"),
            "indexed_at": datetime.now().isoformat(),
            # Additional metadata fields
            "rfp_title": request.metadata.get("rfp_title", ""),
            "project_name": request.metadata.get("project_name", ""),
            "vendor_name": request.metadata.get("vendor_name", ""),
            "response": "",  # Will be updated after AI processing
        }
        
        # Store in ChromaDB (query collection for similar query search)
        # Note: This uses chief_engineer.query_collection
        if hasattr(chief_engineer, 'query_collection') and chief_engineer.query_collection:
            chief_engineer.query_collection.add(
                ids=[request.query_id],
                embeddings=[embedding],
                documents=[request.query_text],
                metadatas=[metadata]
            )
            logger.info(f"✓ Stored in ChromaDB query collection")
        else:
            logger.warning("Query collection not initialized, skipping ChromaDB storage")
        
        processing_time = (datetime.now() - start_time).total_seconds()
        
        logger.info(f"✅ Query {request.query_id} stored successfully")
        logger.info(f"   Processing time: {processing_time:.3f}s")
        logger.info(f"   Embedding dimension: {embedding_dimension}")
        
        return StoreQueryResponse(
            success=True,
            query_id=request.query_id,
            message="Query stored in vector database",
            embedding_dimension=embedding_dimension,
            processing_time=processing_time
        )
        
    except Exception as e:
        logger.error(f"❌ Error storing query {request.query_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/chief-engineer/process", response_model=ProcessQueryResponse)
async def process_query(request: ProcessQueryRequest):
    """
    Process vendor query with Chief Engineer 6-step workflow
    
    Called by NestJS backend when admin triggers AI processing
    
    Workflow Steps:
    1. Analyze Query with RFP Context
    2. Search Historical Data
    3. Retrieve Similar Past Queries
    4. Generate Draft Response
    5. Validate and Enhance Response
    6. Calculate Confidence Score
    """
    start_time_process = datetime.now()
    
    try:
        logger.info(f"Processing query: {request.query_id}")
        logger.info(f"Query text: {request.query_text[:100]}...")

        # Create the workflow record first so steps have a real workflow_id to
        # persist against (previously this was hardcoded to None, so no
        # workflow_executions/workflow_steps rows were ever written here).
        workflow = await chief_engineer.workflow_manager.create_workflow(request.query_id)
        workflow_id = workflow["workflow_id"]
        logger.info(f"Created workflow {workflow_id} for query {request.query_id}")

        # Execute Chief Engineer workflow (only pass accepted arguments)
        result = await chief_engineer.process_query(
            query_id=request.query_id,
            query_text=request.query_text,
            rfp_context=request.rfp_context,
            vendor_id=None,
            workflow_id=workflow_id
        )
        
        # Calculate processing time
        processing_time = (datetime.now() - start_time_process).total_seconds()
        
        # Update statistics
        stats["total_queries_processed"] += 1
        stats["total_workflows_executed"] += 1
        stats["total_processing_time"] += processing_time
        # Use 'confidence_score' with fallback to 'confidence'
        conf_score = result.get("confidence_score")
        if conf_score is None:
            conf_score = result.get("confidence", 0.0)
        
        logger.info(f"[DEBUG] Confidence extraction:")
        logger.info(f"  - result.get('confidence_score'): {result.get('confidence_score')}")
        logger.info(f"  - result.get('confidence'): {result.get('confidence')}")
        logger.info(f"  - Final conf_score: {conf_score}")
        logger.info(f"[ProcessQuery] Final result dict: {json.dumps(result, indent=2)}")
        stats["total_confidence"] += conf_score

        if conf_score >= request.min_confidence:
            stats["successful_queries"] += 1
        else:
            stats["failed_queries"] += 1

        # Prepare response
        # Use 'response_text' as the main response, fallback to 'ai_response' if present
        main_response = result.get("response_text")
        if main_response is None:
            main_response = result.get("ai_response", "")

        # Ensure execution_id is always a string (never None)
        execution_id = result.get("execution_id")
        if not execution_id:
            # Try to get from workflow_id or fallback to query_id
            execution_id = result.get("workflow_id") or request.query_id or ""
        execution_id = str(execution_id)

        # **NEW: Save AI response to PostgreSQL**
        from db_utils import save_ai_response_to_db
        
        ai_response = main_response
        past_ref_response = result.get("past_ref_response", "")
        past_response = result.get("past_response", "")
        
        logger.info("[ProcessQuery] Saving AI response to PostgreSQL...")
        db_save_success = await save_ai_response_to_db(
            query_id=request.query_id,
            ai_response=ai_response,
            past_ref_response=past_ref_response,
            past_response=past_response,
            confidence=conf_score
        )
        
        if db_save_success:
            logger.info(f"✅ PostgreSQL updated for query {request.query_id}")
        else:
            logger.warning(f"⚠️  Failed to update PostgreSQL for query {request.query_id}")

        response_data = ResponseData(
            ai_response=main_response,
            past_ref_response=result.get("past_ref_response"),
            past_response=result.get("past_response"),
            confidence=conf_score,
            source_documents=result.get("source_documents", []),
            execution_id=execution_id,
            workflow_steps=result.get("workflow_steps", []),
            processing_time=processing_time
        )

        logger.info(f"✅ Query processed successfully: {request.query_id}")
        logger.info(f"   Confidence: {conf_score:.2%}")
        logger.info(f"   Processing time: {processing_time:.2f}s")
        
        return ProcessQueryResponse(
            success=True,
            query_id=request.query_id,
            execution_id=execution_id,
            response=response_data,
            message="Query processed successfully"
        )
        
    except Exception as e:
        logger.error(f"❌ Error processing query {request.query_id}: {str(e)}")
        stats["failed_queries"] += 1
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/chief-engineer/update-response")
async def update_query_response(query_id: str, response_text: str):
    """
    Update the response for a query in ChromaDB after processing completes
    
    This stores the AI-generated response back into the vendor_queries collection
    so that future similar queries can retrieve this response as past_response
    
    Called by NestJS backend after response is persisted to PostgreSQL
    """
    try:
        logger.info(f"Updating response for query: {query_id}")
        
        # Update the query in ChromaDB with the new response
        if hasattr(chief_engineer, 'query_collection') and chief_engineer.query_collection:
            results = chief_engineer.query_collection.get(
                ids=[query_id],
                include=["metadatas"]
            )

            if results and results.get("metadatas"):
                # Update metadata with response
                metadata = results["metadatas"][0]
                metadata["response"] = response_text
                metadata["response_updated_at"] = datetime.now().isoformat()

                # Update metadata in ChromaDB without touching documents/embeddings
                chief_engineer.query_collection.update(
                    ids=[query_id],
                    metadatas=[metadata]
                )
                logger.info(f"✅ Response updated in ChromaDB for query: {query_id}")
            else:
                logger.warning(f"⚠️ Query {query_id} not found in ChromaDB")
        
        return {
            "success": True,
            "query_id": query_id,
            "message": "Response updated successfully"
        }
        
    except Exception as e:
        logger.error(f"❌ Error updating response for {query_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/chief-engineer/similar-queries", response_model=SimilarQueriesResponse)
async def find_similar_queries(request: SimilarQueriesRequest):
    """
    Find similar past queries
    
    Used for showing related queries to admin/vendors
    """
    start_time_search = datetime.now()
    
    try:
        logger.info(f"Finding similar queries for: {request.query_text[:100]}...")
        
        # Search for similar queries
        similar = await chief_engineer.find_similar_queries(
            query_text=request.query_text,
            top_k=request.top_k,
            rfp_id=request.rfp_id,
            category=request.category
        )
        
        # Calculate execution time
        execution_time = (datetime.now() - start_time_search).total_seconds()
        
        logger.info(f"✅ Found {len(similar)} similar queries in {execution_time:.2f}s")
        
        return SimilarQueriesResponse(
            success=True,
            query=request.query_text,
            similar_queries=similar,
            execution_time=execution_time
        )
        
    except Exception as e:
        logger.error(f"❌ Error finding similar queries: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

class AnswerQueryRequest(BaseModel):
    """Request model for simple answer query"""
    query_id: str
    query_text: str = Field(..., min_length=1)

class AnswerQueryResponse(BaseModel):
    """Response model for simple answer query"""
    success: bool
    query_id: str
    answer: str
    confidence: float
    processing_time: float
    past_ref_response: Optional[str] = None  # RFP references from Instance 4
    past_response: Optional[str] = None      # Past Q&A responses from Instance 4

@app.post("/api/chief-engineer/answer-query", response_model=AnswerQueryResponse)
async def answer_query(request: AnswerQueryRequest):
    """
    Get AI answer for a query (simplified endpoint for vectorization workflow)
    
    Called by NestJS backend after vectorization to get AI response
    """
    start_time = datetime.now()
    
    try:
        logger.info(f"Getting AI answer for query: {request.query_id}")
        logger.info(f"Query text: {request.query_text[:100]}...")
        
        # Execute Chief Engineer workflow with minimal configuration
        result = await chief_engineer.process_query(
            query_id=request.query_id,
            query_text=request.query_text,
            rfp_context=None,
            vendor_id=None,
            workflow_id=None
        )
        
        # Calculate processing time
        processing_time = (datetime.now() - start_time).total_seconds()
        
        # Extract answer, confidence, and supporting data from Instance 4
        ai_response = result.get("response_text", "No response generated")
        confidence = result.get("confidence_score") or result.get("confidence", 0.0)
        past_ref_response = result.get("past_ref_response", "")  # RFP references from Instance 4
        past_response = result.get("past_response", "")          # Response text from Instance 4
        
        logger.info(f"✅ Generated AI answer in {processing_time:.2f}s with confidence {confidence:.2f}")
        logger.info(f"   Past RFP references: {len(past_ref_response) if past_ref_response else 0} chars")
        logger.info(f"   Past response: {len(past_response) if past_response else 0} chars")
        
        return AnswerQueryResponse(
            success=True,
            query_id=request.query_id,
            answer=ai_response,
            confidence=confidence,
            processing_time=processing_time,
            past_ref_response=past_ref_response if past_ref_response else None,
            past_response=past_response if past_response else None
        )
        
    except Exception as e:
        logger.error(f"❌ Error getting AI answer for query {request.query_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

def _parse_final_result(raw_final_result: Any) -> Dict[str, Any]:
    """final_result is stored as jsonb; asyncpg may hand it back as a raw
    JSON string or an already-decoded dict depending on the query path."""
    if not raw_final_result:
        return {}
    if isinstance(raw_final_result, dict):
        return raw_final_result
    try:
        return json.loads(raw_final_result)
    except (TypeError, ValueError):
        return {}


def _workflow_to_frontend_shape(workflow: Dict[str, Any], query_text: str) -> Dict[str, Any]:
    """
    Convert a workflow_manager workflow dict (snake_case, DB-shaped) into the
    exact camelCase shape frontend/app/prebid-query/workflow/workflow-page.tsx
    expects. The two shapes drifted apart (missing queryText/finalResponse/
    confidence, snake_case vs camelCase throughout) because nothing ever
    exercised this endpoint with real data until now - workflow_executions
    was empty for the entire prior life of this feature.
    """
    final_result = _parse_final_result(workflow.get("final_result"))
    confidence_fraction = final_result.get("confidence_score")

    return {
        "executionId": workflow["workflow_id"],
        "queryId": workflow["query_id"],
        "queryText": query_text,
        "status": workflow["status"],
        "startTime": workflow["created_at"],
        "endTime": workflow.get("processing_end"),
        "totalDuration": workflow.get("total_duration_ms"),
        "finalResponse": final_result.get("response_text"),
        "confidence": round(confidence_fraction * 100, 1) if confidence_fraction is not None else None,
        "steps": [
            {
                "stepNumber": step["step_number"],
                "name": step["step_name"],
                "status": step["status"],
                "duration": step.get("duration_ms"),
                "startTime": step.get("start_time"),
                "endTime": step.get("end_time"),
                "output": step.get("result"),
                "error": step.get("error_message"),
            }
            for step in workflow.get("steps", [])
        ],
    }


@app.get("/api/workflow/executions")
async def get_workflow_executions(
    limit: int = 50,
    query_id: Optional[str] = None,
    status: Optional[str] = None
):
    """
    Get workflow execution history

    Used by admin to monitor workflow execution
    """
    try:
        # Get workflow summaries (no steps, by design - see list_workflows docstring)
        summaries = await workflow_manager.list_workflows(
            status=status,
            limit=limit
        )

        # Filter by query_id if provided
        if query_id:
            summaries = [w for w in summaries if w["query_id"] == query_id]

        # The frontend needs full step details per execution (there is no separate
        # per-execution detail fetch in the UI), so fetch each workflow's full
        # record - including steps - via the already-correct get_workflow().
        workflows = [
            await workflow_manager.get_workflow(summary["workflow_id"])
            for summary in summaries
        ]
        workflows = [w for w in workflows if w is not None]

        # workflow_executions only stores query_id, not the query text itself -
        # fetch it from the queries table for each workflow.
        query_texts: Dict[str, str] = {}
        if workflows:
            async with workflow_manager.db_pool.acquire() as conn:
                rows = await conn.fetch(
                    "SELECT query_id, query_text FROM queries WHERE query_id = ANY($1::uuid[])",
                    [w["query_id"] for w in workflows],
                )
                query_texts = {str(row["query_id"]): row["query_text"] for row in rows}

        return [
            _workflow_to_frontend_shape(workflow, query_texts.get(workflow["query_id"], ""))
            for workflow in workflows
        ]

    except Exception as e:
        logger.error(f"❌ Error getting workflow executions: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/workflow/executions/{execution_id}", response_model=WorkflowExecutionResponse)
async def get_workflow_execution(execution_id: str):
    """
    Get specific workflow execution details
    
    Used for detailed workflow visualization
    """
    try:
        execution = workflow_manager.get_execution(execution_id)
        
        if not execution:
            raise HTTPException(status_code=404, detail="Execution not found")
        
        return WorkflowExecutionResponse(
            execution_id=execution.execution_id,
            query_id=execution.query_id,
            status=execution.status,
            steps=execution.steps,
            total_duration=execution.total_duration,
            created_at=execution.created_at,
            completed_at=execution.completed_at
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error getting execution {execution_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/statistics", response_model=StatisticsResponse)
async def get_statistics():
    """Get service statistics"""
    # Calculate averages
    avg_processing_time = 0.0
    avg_confidence = 0.0
    success_rate = 0.0
    
    if stats["total_queries_processed"] > 0:
        avg_processing_time = stats["total_processing_time"] / stats["total_queries_processed"]
        avg_confidence = stats["total_confidence"] / stats["total_queries_processed"]
        success_rate = stats["successful_queries"] / stats["total_queries_processed"]
    
    # Calculate uptime
    uptime = (datetime.now() - start_time).total_seconds()
    
    return StatisticsResponse(
        total_queries_processed=stats["total_queries_processed"],
        total_workflows_executed=stats["total_workflows_executed"],
        average_processing_time=round(avg_processing_time, 2),
        average_confidence_score=round(avg_confidence, 2),
        success_rate=round(success_rate, 2),
        uptime_seconds=round(uptime, 2)
    )

@app.post("/api/chief-engineer/test")
async def test_workflow():
    """
    Test endpoint for workflow verification
    
    Useful for testing without NestJS backend
    """
    try:
        test_query = ProcessQueryRequest(
            query_id="test-" + str(uuid.uuid4()),
            query_text="What is the minimum EMD requirement for highway construction projects?",
            rfp_context={
                "rfp_number": "RFP-TEST-001",
                "project_name": "Highway Construction Test"
            },
            use_historical_data=True,
            search_similar_queries=True,
            top_k=5,
            min_confidence=0.7
        )
        
        result = await process_query(test_query)
        
        return {
            "success": True,
            "message": "Test workflow executed successfully",
            "result": result
        }
        
    except Exception as e:
        logger.error(f"❌ Test workflow failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# =============================================================================
# Main Entry Point
# =============================================================================

if __name__ == "__main__":
    import uvicorn
    
    # Configuration
    HOST = os.getenv("HOST", "0.0.0.0")
    PORT = int(os.getenv("PORT", "8001"))
    
    logger.info("="*60)
    logger.info("NHAI Chief Engineer Agent - Screen 8")
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
