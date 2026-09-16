"""
Chief Engineer RAG Service - Semantic Search & Answer Generation
NHAI Tender Query Automation System

This service provides semantic search and context-aware answer generation for Chief Engineer queries.
It uses ChromaDB for unified vector storage (RFPs, queries, answers).
"""

import os
import logging
from datetime import datetime
from typing import List, Dict, Any
import chromadb
from chromadb.config import Settings

# Embedding generator and LLM imports (assume langchain or similar)
from langchain_community.llms import Ollama
from langchain_community.embeddings import OllamaEmbeddings
from langchain_core.prompts import PromptTemplate

# Logging setup
logger = logging.getLogger("chief_engineer_rag_service")
logger.setLevel(logging.INFO)
log_formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')

# File handler for persistent logs
log_file = os.getenv("CHIEF_ENGINEER_RAG_LOG", "chief_engineer_rag_service.log")
file_handler = logging.FileHandler(log_file)
file_handler.setFormatter(log_formatter)
logger.addHandler(file_handler)

# Console handler for terminal logs
console_handler = logging.StreamHandler()
console_handler.setFormatter(log_formatter)
logger.addHandler(console_handler)

# ChromaDB setup (points to Screen 8 query_db where vendor queries are stored)
CHROMA_PERSIST_DIRECTORY = os.getenv("CHROMA_PERSIST_DIRECTORY", "./query_db")
chroma_client = chromadb.PersistentClient(path=CHROMA_PERSIST_DIRECTORY)
collection_name = os.getenv("CHIEF_ENGINEER_COLLECTION", "vendor_queries")
query_collection = chroma_client.get_or_create_collection(collection_name)

# Embedding model (use the same model as main service for compatibility)
embedding_model_name = os.getenv("OLLAMA_EMBEDDING_MODEL", "nomic-embed-text:latest")
embedding_generator = OllamaEmbeddings(model=embedding_model_name, base_url=os.getenv("OLLAMA_BASE_URL", "http://localhost:11434"))

# LLM for answer generation (use dedicated LLM model, not embedding model)
llm_model_name = os.getenv("OLLAMA_LLM_MODEL", "tinyllama")
llm = Ollama(model=llm_model_name, base_url=os.getenv("OLLAMA_BASE_URL", "http://localhost:11434"))

# API endpoint (FastAPI)
from fastapi import FastAPI
from fastapi.responses import JSONResponse
import uvicorn

app = FastAPI()

@app.post('/api/chief-engineer/query')
async def chief_engineer_query(request_data: dict):
    logger.info("\n=== [REQUEST RECEIVED] ===")
    start_time = datetime.now()
    query_id = request_data.get("query_id")
    query_text = request_data.get("query_text")
    rfp_context = request_data.get("rfp_context", {})
    metadata = request_data.get("metadata", {})
    logger.info(f"Processing query: {query_id}")
    logger.info(f"Query text: {query_text}")
    
    logger.info("\n=== [STEP 1: Embedding Generation] ===")
    embedding_start = datetime.now()
    embedding = embedding_generator.embed_query(text=query_text)
    embedding_time = (datetime.now() - embedding_start).total_seconds()
    logger.info(f"Generated embedding with dimension: {len(embedding)} (took {embedding_time:.2f}s)")
    
    logger.info("\n=== [STEP 2: Semantic Search] ===")
    search_start = datetime.now()
    # Search for similar queries/RFPs/answers
    results = query_collection.query(
        query_embeddings=[embedding],
        n_results=5,
        include=["documents", "metadatas", "distances"]
    )
    search_time = (datetime.now() - search_start).total_seconds()
    found_count = len(results['documents'][0]) if results['documents'] else 0
    logger.info(f"Found {found_count} similar items (took {search_time:.2f}s)")
    
    logger.info("\n=== [STEP 3: Context Aggregation] ===")
    context_chunks = []
    if results["documents"]:
        for doc, meta, dist in zip(results["documents"][0], results["metadatas"][0], results["distances"][0]):
            context_chunks.append(f"[Source: {meta.get('rfp_number', '')}] {doc} (Similarity: {1-dist:.2f})")
    context_str = "\n---\n".join(context_chunks)
    if context_str.strip():
        logger.info(f"Aggregated context: {context_str[:200]}...")
    else:
        logger.info("No context found, will generate answer without semantic context")
    
    logger.info("\n=== [STEP 4: Answer Generation] ===")
    generation_start = datetime.now()
    prompt = PromptTemplate(
        template="""You are a Chief Engineer responding to a pre-bid query for an NHAI highway project.

RFP: {rfp_context}
Query: {query_text}

Relevant Context:
{context}

Generate a professional, concise response (max 500 words) that:
1. Directly addresses the query
2. References relevant tender clauses
3. Maintains professional tone
4. Provides clear, actionable information

Response:""",
        input_variables=["rfp_context", "query_text", "context"]
    )
    
    try:
        llm_response = llm.generate([
            prompt.format(
                rfp_context=str(rfp_context),
                query_text=query_text,
                context=context_str if context_str.strip() else "No similar items found in database."
            )
        ])
        if hasattr(llm_response, "generations") and llm_response.generations and llm_response.generations[0]:
            answer_text = llm_response.generations[0][0].text
        else:
            answer_text = str(llm_response)
    except Exception as e:
        logger.error(f"LLM generation failed: {str(e)}")
        answer_text = f"Error generating response: {str(e)}"
    
    generation_time = (datetime.now() - generation_start).total_seconds()
    logger.info(f"Generated answer: {answer_text[:200]}... (took {generation_time:.2f}s)")
    
    logger.info("\n=== [STEP 5: Response Packaging] ===")
    total_time = (datetime.now() - start_time).total_seconds()
    response = {
        "query_id": query_id,
        "answer": answer_text.strip(),
        "context": context_chunks,
        "similar_items_count": len(context_chunks),
        "processing_time": total_time,
        "timing_breakdown": {
            "embedding_generation": embedding_time,
            "semantic_search": search_time,
            "answer_generation": generation_time
        }
    }
    logger.info(f"Response ready for query {query_id}")
    logger.info(f"Total processing time: {total_time:.2f}s")
    logger.info("\n=== [REQUEST COMPLETED] ===\n")
    return JSONResponse(response)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("CHIEF_ENGINEER_RAG_PORT", "8006")), reload=False)
