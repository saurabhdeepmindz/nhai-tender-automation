# rag_service/main.py

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional
import logging
import os
from datetime import datetime

from document_processor import DocumentProcessor
from chroma_service import ChromaService
from langchain.chat_models import ChatOpenAI
from langchain.prompts import ChatPromptTemplate

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="NHAI Tender Query RAG Service",
    description="AI-powered document processing and semantic search for tender queries",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
use_local_embeddings = os.getenv("USE_LOCAL_EMBEDDINGS", "false").lower() == "true"
embedding_model = "local" if use_local_embeddings else "openai"

document_processor = DocumentProcessor(embedding_model=embedding_model)
chroma_service = ChromaService(persist_directory=os.getenv("CHROMA_DB_DIR", "./chroma_db"))

# Initialize LLM for response generation
llm = ChatOpenAI(
    model=os.getenv("OPENAI_MODEL", "gpt-4"),
    temperature=float(os.getenv("OPENAI_TEMPERATURE", "0.3")),
    openai_api_key=os.getenv("OPENAI_API_KEY")
)

# ==============================================================================
# Request/Response Models
# ==============================================================================

class ProcessDocumentRequest(BaseModel):
    document_id: int
    file_path: str
    document_type: str  # RFP, Q&A, CORRIGENDUM
    rfp_number: str
    title: str

class SemanticSearchRequest(BaseModel):
    query: str
    rfp_number: Optional[str] = None
    category: Optional[str] = None
    search_type: str = "qa_pairs"  # qa_pairs, rfp_documents, all
    n_results: int = 5

class GenerateResponseRequest(BaseModel):
    query: str
    rfp_number: str
    similar_queries: List[Dict]
    context_type: str = "pre_bid_query"

class ProcessingStatusResponse(BaseModel):
    success: bool
    document_id: int
    extracted_content: str
    metadata: Dict

# ==============================================================================
# API Endpoints
# ==============================================================================

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "service": "NHAI Tender Query RAG Service",
        "status": "running",
        "version": "1.0.0",
        "timestamp": datetime.now().isoformat()
    }

@app.get("/stats")
async def get_stats():
    """Get vector database statistics"""
    try:
        stats = chroma_service.get_collection_stats()
        return {
            "success": True,
            "statistics": stats,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Error fetching stats: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/process-document")
async def process_document(request: ProcessDocumentRequest):
    """
    Process uploaded document and store in vector database
    Called by NestJS background job processor

    Handles:
    - Text extraction
    - Embedding generation
    - Storage in ChromaDB
    """
    logger.info(f"Processing document {request.document_id}: {request.document_type}")

    try:
        if request.document_type == 'RFP':
            # Process RFP document
            result = await document_processor.process_rfp_document(
                file_path=request.file_path,
                document_id=request.document_id,
                rfp_number=request.rfp_number,
                title=request.title
            )

            # Store in ChromaDB
            chroma_service.add_rfp_document(
                document_id=request.document_id,
                rfp_number=request.rfp_number,
                title=request.title,
                content=result['extracted_content'],
                embeddings=result['document_embedding'],
                metadata=result['metadata']
            )

            return ProcessingStatusResponse(
                success=True,
                document_id=request.document_id,
                extracted_content=result['extracted_content'][:500] + "...",
                metadata=result['metadata']
            )

        elif request.document_type == 'Q&A':
            # Process Q&A CSV
            qa_pairs = await document_processor.process_qa_csv(
                file_path=request.file_path,
                document_id=request.document_id,
                rfp_number=request.rfp_number
            )

            # Store each Q&A pair in ChromaDB
            for qa in qa_pairs:
                chroma_service.add_qa_pair(
                    document_id=request.document_id,
                    rfp_number=request.rfp_number,
                    query=qa['query'],
                    response=qa['response'],
                    query_embeddings=qa['combined_embedding'],
                    category=qa['category'],
                    metadata=qa['metadata']
                )

            return ProcessingStatusResponse(
                success=True,
                document_id=request.document_id,
                extracted_content=f"Processed {len(qa_pairs)} Q&A pairs",
                metadata={
                    'qa_pairs_count': len(qa_pairs),
                    'document_id': request.document_id
                }
            )

        elif request.document_type == 'CORRIGENDUM':
            # Process corrigendum
            result = await document_processor.process_corrigendum(
                file_path=request.file_path,
                document_id=request.document_id,
                rfp_number=request.rfp_number,
                title=request.title
            )

            # Store in ChromaDB
            chroma_service.add_corrigendum(
                document_id=request.document_id,
                rfp_number=request.rfp_number,
                title=request.title,
                content=result['extracted_content'],
                embeddings=result['document_embedding'],
                metadata=result['metadata']
            )

            return ProcessingStatusResponse(
                success=True,
                document_id=request.document_id,
                extracted_content=result['extracted_content'][:500] + "...",
                metadata=result['metadata']
            )

        else:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported document type: {request.document_type}"
            )

    except Exception as e:
        logger.error(f"Error processing document {request.document_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/semantic-search")
async def semantic_search(request: SemanticSearchRequest):
    """
    Semantic search for similar documents/queries
    Primary endpoint used by Screen 07 (Pre-bid Query Management)

    Returns:
        Similar documents with similarity scores
    """
    logger.info(f"Semantic search: {request.query[:50]}...")

    try:
        # Generate embeddings for the query
        query_embedding = document_processor.generate_embedding(request.query)

        # Perform search based on type
        if request.search_type == "qa_pairs":
            results = chroma_service.semantic_search_qa(
                query_embeddings=query_embedding,
                rfp_number=request.rfp_number,
                category=request.category,
                n_results=request.n_results
            )

        elif request.search_type == "rfp_documents":
            results = chroma_service.semantic_search_rfp(
                query_embeddings=query_embedding,
                rfp_number=request.rfp_number,
                n_results=request.n_results
            )

        elif request.search_type == "all":
            all_results = chroma_service.semantic_search_all(
                query_embeddings=query_embedding,
                rfp_number=request.rfp_number,
                n_results=request.n_results
            )
            return {
                "success": True,
                "query": request.query,
                "results": all_results,
                "total_found": sum(len(v) for v in all_results.values())
            }

        else:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid search_type: {request.search_type}"
            )

        return {
            "success": True,
            "query": request.query,
            "results": results,
            "total_found": len(results)
        }

    except Exception as e:
        logger.error(f"Error in semantic search: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate-response")
async def generate_response(request: GenerateResponseRequest):
    """
    Generate AI response for vendor query using RAG
    Uses similar past queries as context

    Used in Screen 07 when admin reviews vendor query
    """
    logger.info(f"Generating response for: {request.query[:50]}...")

    try:
        # Build context from similar past queries
        context = "PAST SIMILAR QUERIES AND RESPONSES:\n\n"

        for i, sim_query in enumerate(request.similar_queries, 1):
            original_query = sim_query.get('originalQuery') or sim_query.get('query', '')
            original_response = sim_query.get('originalResponse') or sim_query.get('response', '')
            similarity = sim_query.get('similarity', 0)

            context += f"{i}. Past Query: {original_query}\n"
            context += f"   Past Response: {original_response}\n"
            context += f"   Similarity: {similarity:.1%}\n"
            context += f"   RFP: {sim_query.get('rfpNumber', 'N/A')}\n\n"

        # Create prompt for LLM
        prompt = ChatPromptTemplate.from_messages([
            ("system", """You are an expert assistant for NHAI (National Highways Authority of India) tender query management.

Your task is to generate a clear, accurate, and professional response to a vendor's query about an RFP.

Guidelines:
1. Use the past similar queries and responses as reference
2. Adapt your response to the specific query at hand
3. Be concise but comprehensive
4. Cite relevant RFP sections when applicable
5. Maintain professional tone
6. If information is not available, state clearly that it needs to be reviewed
7. DO NOT make up information not present in the context

Format:
- Start with a direct answer
- Provide supporting details
- Reference relevant RFP sections if applicable
- Keep response between 100-300 words"""),

            ("human", f"""RFP Number: {request.rfp_number}

Vendor Query: {request.query}

{context}

Based on the above context and similar past queries, provide a comprehensive response to the vendor's query.""")
        ])

        # Generate response using LLM
        chain = prompt | llm
        response = chain.invoke({})

        # Calculate confidence score
        confidence = calculate_confidence_score(request.similar_queries)

        return {
            "success": True,
            "query": request.query,
            "response": response.content,
            "confidence": confidence,
            "confidence_label": get_confidence_label(confidence),
            "source_documents": [
                sq.get('rfpNumber', 'N/A')
                for sq in request.similar_queries[:3]
            ],
            "num_references": len(request.similar_queries)
        }

    except Exception as e:
        logger.error(f"Error generating response: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/document/{document_id}")
async def delete_document(document_id: int, document_type: str):
    """Delete document from vector database"""
    try:
        chroma_service.delete_document(document_id, document_type)
        return {
            "success": True,
            "message": f"Document {document_id} deleted successfully"
        }
    except Exception as e:
        logger.error(f"Error deleting document: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# ==============================================================================
# Helper Functions
# ==============================================================================

def calculate_confidence_score(similar_queries: List[Dict]) -> float:
    """
    Calculate confidence score based on similarity of past queries

    Args:
        similar_queries: List of similar queries with similarity scores

    Returns:
        float: Confidence score (0.0 - 1.0)
    """
    if not similar_queries:
        return 0.5  # Medium confidence if no similar queries

    # Get top 3 similarities
    top_similarities = [
        sq.get('similarity', 0)
        for sq in similar_queries[:3]
    ]

    # Calculate weighted average (more weight to top result)
    weights = [0.5, 0.3, 0.2]
    weighted_sum = sum(
        sim * weight
        for sim, weight in zip(top_similarities, weights[:len(top_similarities)])
    )

    # Normalize to 0.7-1.0 range for better UX
    confidence = 0.7 + (weighted_sum * 0.3)

    return min(1.0, max(0.0, confidence))

def get_confidence_label(confidence: float) -> str:
    """Get human-readable confidence label"""
    if confidence >= 0.9:
        return "Very High"
    elif confidence >= 0.8:
        return "High"
    elif confidence >= 0.7:
        return "Medium"
    elif confidence >= 0.6:
        return "Low"
    else:
        return "Very Low"

# ==============================================================================
# Startup/Shutdown Events
# ==============================================================================

@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    logger.info("Starting NHAI Tender Query RAG Service...")
    logger.info(f"Using embedding model: {embedding_model}")
    logger.info(f"ChromaDB directory: {os.getenv('CHROMA_DB_DIR', './chroma_db')}")

    # Log collection statistics
    stats = chroma_service.get_collection_stats()
    logger.info(f"Vector DB Statistics: {stats}")

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    logger.info("Shutting down NHAI Tender Query RAG Service...")

# ==============================================================================
# Run with: uvicorn main:app --host 0.0.0.0 --port 8000 --reload
# ==============================================================================
