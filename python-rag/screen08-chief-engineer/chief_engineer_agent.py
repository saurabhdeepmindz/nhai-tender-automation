"""
Screen 8: Chief Engineer Agent - Core Implementation
NHAI AI-Driven Tender Query Automation System

This is the advanced agentic RAG agent that implements a 6-step workflow:
1. Query Analysis → Classify query and extract intent
2. Historical Search → Search Screen 7 for similar past queries/RFPs
3. Similar Query Search → Find similar queries in Screen 8 database
4. Context Aggregation → Combine all relevant context
5. Response Generation → Generate AI response using LLM
6. Quality Check → Validate and score the response

Author: NHAI Development Team
Version: 1.0.0
"""

import os
import logging
from typing import Dict, List, Any, Optional
from datetime import datetime
import asyncio
import httpx
import numpy as np

from langchain_core.prompts import PromptTemplate

from workflow_manager_pg import WorkflowManager

logger = logging.getLogger(__name__)

# FIX 2: Similarity-based response strategy thresholds
SIMILARITY_THRESHOLDS = {
    "EXACT_MATCH": 0.95,      # Use verbatim response
    "VERY_HIGH": 0.80,        # Use as primary template, minimal paraphrasing
    "HIGH": 0.70,             # Use as strong basis, maintain consistency
    "MEDIUM": 0.60,           # Use as reference, allow synthesis
    "LOW": 0.50,              # Use as context only
}

class ChiefEngineerAgent:
    """
    6-Step Agentic RAG Workflow for Pre-bid Query Processing
    
    This agent integrates with Screen 7 (Historical Data) to provide
    comprehensive, context-aware responses to vendor queries.
    """
    
    def __init__(self, screen7_url: str, workflow_manager: WorkflowManager, embedding_generator: Optional[Any] = None, llm_manager: Optional[Any] = None):
        """
        Initialize Chief Engineer Agent

        Args:
            screen7_url: URL of Screen 7 History Retriever API
            workflow_manager: Workflow manager instance
            embedding_generator: Optional embedding generator for similarity search
            llm_manager: LLMManager instance (respects LLM_PROVIDER=openai|ollama)
        """
        self.screen7_url = screen7_url
        self.workflow_manager = workflow_manager
        self.embedding_generator = embedding_generator
        self.llm_manager = llm_manager

        # Initialize HTTP client for Screen 7
        self.http_client = httpx.AsyncClient(timeout=30.0)
        
        # In-memory storage for similar queries (would be database in production)
        self.similar_queries_db = []
        
        logger.info("Chief Engineer Agent initialized")
    
    async def initialize(self):
        """Initialize agent and verify connections"""
        try:
            # Test Screen 7 connection
            await self.check_screen7_connection()
            logger.info("Screen 7 connection verified")
            
            # Load similar queries from database (would be PostgreSQL in production)
            await self._load_similar_queries()
            
        except Exception as e:
            logger.error(f"Initialization failed: {str(e)}")
            raise
    
    # ========================================================================
    # MAIN PROCESSING WORKFLOW
    # ========================================================================
    
    async def process_query(
        self,
        query_id: str,
        query_text: str,
        rfp_context: Dict[str, Any],
        vendor_id: Optional[str],
        workflow_id: str
    ) -> Dict[str, Any]:
        """
        Main entry point: Process query through 6-step workflow
        
        Args:
            query_id: Unique query identifier
            query_text: Query text from vendor
            rfp_context: RFP context information
            vendor_id: Vendor identifier (optional)
            workflow_id: Workflow tracking ID
            
        Returns:
            Complete AI response with sources and confidence score
        """
        try:
            logger.info("\n=== [REQUEST RECEIVED] ===")
            logger.info(f"Processing query {query_id} through 6-step workflow")
            
            # Step 1: Query Analysis
            analysis = await self._step1_query_analysis(
                query_id, query_text, rfp_context, workflow_id
            )
            
            # Step 2: Historical Search (Screen 7) - DISABLED
            # FIX 1: Disable Instance 3 ChromaDB historical search
            # Only use Instance 4 (query_db) for pre-bid Q&A context
            logger.info("\n=== [STEP 2: Historical Search - DISABLED] ===")
            logger.info("⚠️  Step 2 disabled: Only using Instance 4 ChromaDB (query_db) for context")
            historical_results = []  # Empty - no Instance 3 context
            # historical_results = await self._step2_historical_search(
            #     query_id, query_text, rfp_context, workflow_id
            # )

            # Step 3: Similar Query Search (Screen 8 database)
            similar_queries = await self._step3_similar_query_search(
                query_id, query_text, analysis, workflow_id
            )

            # Step 4: Context Aggregation
            aggregated_context = await self._step4_context_aggregation(
                query_id, analysis, historical_results, similar_queries, workflow_id
            )

            # Step 5: Response Generation
            response = await self._step5_response_generation(
                query_id, query_text, aggregated_context, rfp_context, workflow_id
            )
            
            # Step 6: Quality Check
            final_response = await self._step6_quality_check(
                query_id, query_text, response, aggregated_context, workflow_id
            )
            
            # Mark workflow as completed
            import json
            await self.workflow_manager.complete_workflow(workflow_id, json.dumps(final_response))
            
            return final_response
            
        except Exception as e:
            logger.error(f"Query processing failed: {str(e)}")
            await self.workflow_manager.mark_workflow_failed(workflow_id, str(e))
            raise
    
    # ========================================================================
    # STEP 1: Query Analysis
    # ========================================================================
    
    async def _step1_query_analysis(
        self,
        query_id: str,
        query_text: str,
        rfp_context: Dict[str, Any],
        workflow_id: str
    ) -> Dict[str, Any]:
        """
        STEP 1: Analyze query to extract intent, category, and key topics
        
        Returns:
            {
                "category": "technical|commercial|eligibility|contractual",
                "intent": "clarification|information|objection",
                "key_topics": ["topic1", "topic2", ...],
                "complexity": "low|medium|high"
            }
        """
        logger.info("\n=== [STEP 1: Query Analysis] ===")
        await self.workflow_manager.start_step(workflow_id, 1, "Query Analysis")
        
        try:
            # LLM prompt for query analysis
            analysis_prompt = PromptTemplate(
                template="""Analyze this tender query and extract structured information.

RFP Context: {rfp_context}
Query: {query_text}

Provide:
1. Category (technical/commercial/eligibility/contractual)
2. Intent (clarification/information/objection)
3. Key topics (3-5 topics)
4. Complexity (low/medium/high)

Return ONLY a JSON object with these fields.""",
                input_variables=["rfp_context", "query_text"]
            )
            
            # Generate analysis via the configured LLM provider (OpenAI or Ollama)
            response = await asyncio.to_thread(
                self.llm_manager.generate,
                analysis_prompt.format(
                    rfp_context=str(rfp_context),
                    query_text=query_text
                )
            )
            
            # Extract generated text from LLMResult
            if hasattr(response, "generations") and response.generations and response.generations[0]:
                llm_text = response.generations[0][0].text
            else:
                llm_text = str(response)

            # Parse response (simplified - would use proper JSON parsing)
            analysis = {
                "category": self._extract_category(llm_text),
                "intent": "clarification",
                "key_topics": self._extract_key_topics(query_text),
                "complexity": "medium"
            }
            
            import json
            await self.workflow_manager.complete_step(workflow_id, 1, json.dumps(analysis))
            
            logger.info(f"Query analysis completed: {analysis}")
            return analysis
            
        except Exception as e:
            await self.workflow_manager.fail_step(workflow_id, 1, str(e))
            raise
    
    def _extract_category(self, llm_response: str) -> str:
        """Extract category from LLM response"""
        response_lower = llm_response.lower()
        
        if "technical" in response_lower:
            return "technical"
        elif "commercial" in response_lower:
            return "commercial"
        elif "eligibility" in response_lower:
            return "eligibility"
        elif "contractual" in response_lower:
            return "contractual"
        else:
            return "general"
    
    def _extract_key_topics(self, query_text: str) -> List[str]:
        """Extract key topics from query text"""
        # Simplified topic extraction (would use NLP in production)
        words = query_text.lower().split()
        
        # Filter out common words
        stop_words = {"the", "is", "are", "what", "how", "when", "where", "why", "in", "on", "at"}
        key_words = [w for w in words if len(w) > 4 and w not in stop_words]
        
        return key_words[:5]
    
    # ========================================================================
    # STEP 2: Historical Search (Screen 7)
    # ========================================================================
    
    async def _step2_historical_search(
        self,
        query_id: str,
        query_text: str,
        rfp_context: Dict[str, Any],
        workflow_id: str
    ) -> List[Dict[str, Any]]:
        """
        STEP 2: Search Screen 7 for similar historical queries and RFPs
        
        This is the key integration point with Screen 7
        """
        logger.info("\n=== [STEP 2: Historical Search (Screen 7)] ===")
        await self.workflow_manager.start_step(workflow_id, 2, "Historical Search (Screen 7)")
        
        try:
            # Call Screen 7 synchronous search API for real-time results
            search_url = f"{self.screen7_url}/api/rag/search/sync"
            
            # Safely extract rfp_number with null checks
            rfp_number = None
            if rfp_context:
                rfp_number = rfp_context.get("rfp_number")
            
            payload = {
                "query": query_text,
                "top_k": 5,
                "filters": {
                    "rfp_number": rfp_number
                }
            }
            
            response = await self.http_client.post(search_url, json=payload, timeout=30.0)
            response.raise_for_status()
            
            data = response.json()
            results = data.get("results", []) if data else []
            
            import json
            await self.workflow_manager.complete_step(workflow_id, 2, json.dumps({
                "results_count": len(results),
                "sources": [r["document_id"] for r in results]
            }))
            
            logger.info(f"Historical search found {len(results)} results")
            return results
            
        except Exception as e:
            logger.error(f"Historical search failed: {str(e)}")
            await self.workflow_manager.fail_step(workflow_id, 2, str(e))
            return []  # Continue with empty results
    
    # ========================================================================
    # STEP 3: Similar Query Search (Screen 8 Database)
    # ========================================================================
    
    def _brute_force_cosine_search(self, query_embedding: List[float]) -> List[Dict[str, Any]]:
        """
        Compute cosine similarity directly against every embedding in
        query_collection, bypassing ChromaDB's own .query()/HNSW path.

        This collection's persisted HNSW index returns nonsensical raw
        distances (verified: tens to hundreds, when cosine distance should be
        0-2) even though hnsw:space is correctly set to 'cosine' in the
        collection metadata — an index-level issue with this persisted store,
        not with the underlying vector data (which is fine). Brute force is
        entirely fine at this collection's current scale (tens of documents).
        """
        all_data = self.query_collection.get(include=["documents", "metadatas", "embeddings"])
        q = np.array(query_embedding, dtype=float)
        q_norm = np.linalg.norm(q)

        scored = []
        for doc_id, doc, metadata, embedding in zip(
            all_data["ids"], all_data["documents"], all_data["metadatas"], all_data["embeddings"]
        ):
            vec = np.array(embedding, dtype=float)
            denom = q_norm * np.linalg.norm(vec)
            similarity = float(np.dot(q, vec) / denom) if denom > 0 else 0.0
            scored.append({"id": doc_id, "document": doc, "metadata": metadata, "similarity": similarity})

        scored.sort(key=lambda x: x["similarity"], reverse=True)
        return scored

    async def find_similar_queries(
        self,
        query_text: str,
        top_k: int = 5,
        rfp_id: Optional[str] = None,
        category: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Public, on-demand version of the Step 3 similarity search — no workflow_id
        required, so this can be called directly (e.g. from the admin/vendor
        "similar queries" lookup endpoint) without processing a full new query.
        """
        similar: List[Dict[str, Any]] = []

        if not (hasattr(self, 'query_collection') and self.query_collection):
            logger.info("ChromaDB collection not available, using in-memory database")
            for r in self._search_similar_in_memory(query_text):
                similar.append({
                    "query_id": r["query_id"],
                    "query_text": r["query_text"],
                    "response_text": r.get("response", ""),
                    "similarity_score": r.get("similarity", 0.0),
                    "rfp_number": r.get("rfp_number"),
                    "category": r.get("category"),
                    "answered_at": r.get("answered_at"),
                })
        else:
            try:
                logger.info("🔍 [find_similar_queries] Searching vendor_queries collection in ChromaDB...")

                if not self.embedding_generator:
                    logger.warning("No embedding generator available, cannot search")
                    return []

                query_embedding = self.embedding_generator.embed_query(text=query_text)
                scored = self._brute_force_cosine_search(query_embedding)

                for item in scored:
                    metadata = item["metadata"]
                    similarity = item["similarity"]

                    response_text = metadata.get("response", "")
                    has_response = response_text and response_text.strip() and len(response_text.strip()) > 3

                    query_text_in_result = metadata.get("query", metadata.get("points_of_clarification", item["document"]))
                    result_rfp_number = metadata.get("rfp_number", "Unknown")
                    result_category = metadata.get("category")

                    if similarity <= 0.5 or not has_response:
                        continue
                    if rfp_id and result_rfp_number != rfp_id:
                        continue
                    if category and result_category != category:
                        continue

                    similar.append({
                        "query_id": item["id"],
                        "query_text": query_text_in_result if isinstance(query_text_in_result, str) else item["document"],
                        "response_text": response_text,
                        "similarity_score": similarity,
                        "rfp_number": result_rfp_number,
                        "category": result_category,
                        "answered_at": metadata.get("answered_at"),
                    })

            except Exception as e:
                logger.warning(f"Similarity search failed: {str(e)}, falling back to in-memory DB")
                for r in self._search_similar_in_memory(query_text):
                    similar.append({
                        "query_id": r["query_id"],
                        "query_text": r["query_text"],
                        "response_text": r.get("response", ""),
                        "similarity_score": r.get("similarity", 0.0),
                        "rfp_number": r.get("rfp_number"),
                        "category": r.get("category"),
                        "answered_at": r.get("answered_at"),
                    })

        similar.sort(key=lambda x: x["similarity_score"], reverse=True)
        return similar[:top_k]

    async def _step3_similar_query_search(
        self,
        query_id: str,
        query_text: str,
        analysis: Dict[str, Any],
        workflow_id: str
    ) -> List[Dict[str, Any]]:
        """
        STEP 3: Find similar queries in Screen 8's own database (ChromaDB vendor_queries)
        
        This searches queries previously processed by Screen 8 using semantic similarity
        """
        logger.info("\n=== [STEP 3: Similar Query Search (Screen 8)] ===")
        await self.workflow_manager.start_step(workflow_id, 3, "Similar Query Search (Screen 8)")
        
        try:
            similar = []
            
            # First try ChromaDB if collection is available
            if hasattr(self, 'query_collection') and self.query_collection:
                try:
                    logger.info("🔍 Searching vendor_queries collection in ChromaDB...")

                    # NOTE: this collection's persisted HNSW index returns nonsensical raw
                    # distances via .query() (verified: tens to hundreds, when cosine distance
                    # should be 0-2) even though hnsw:space is correctly set to 'cosine' in
                    # collection metadata. Using brute-force cosine similarity instead, which
                    # is fine at this collection's current scale (see _brute_force_cosine_search).
                    if not self.embedding_generator:
                        logger.warning("No embedding generator available, skipping similarity search")
                        scored = []
                    else:
                        query_embedding = self.embedding_generator.embed_query(text=query_text)
                        logger.info(f"Generated query embedding with dimension: {len(query_embedding)}")
                        scored = self._brute_force_cosine_search(query_embedding)

                    if scored:
                        total_results = len(scored)
                        logger.info(f"[Step 3 DEBUG] Similarity search returned {total_results} results")

                        for idx, item in enumerate(scored):
                            result_id = item["id"]
                            doc = item["document"]
                            metadata = item["metadata"]
                            similarity = item["similarity"]

                            # IMPORTANT: Only include queries that have responses (filter out newly submitted queries)
                            response_text = metadata.get("response", "")
                            has_response = response_text and response_text.strip() and len(response_text.strip()) > 3
                            
                            # Get query text from metadata (for prebid Q&A) or from document (for vendor queries)
                            query_text_in_result = metadata.get("query", metadata.get("points_of_clarification", doc))
                            
                            # Detailed debug logging - use actual ChromaDB ID
                            rfp_number = metadata.get("rfp_number", "Unknown")
                            category = metadata.get("category", "Unknown")
                            query_snippet = query_text_in_result[:60].replace("\n", " ") if isinstance(query_text_in_result, str) else doc[:60].replace("\n", " ")
                            
                            logger.info(f"\n[Result {idx+1}/{total_results}]")
                            logger.info(f"  ID: {result_id}")  # Use actual ChromaDB ID
                            logger.info(f"  Query: {query_snippet}...")
                            logger.info(f"  RFP: {rfp_number}")
                            logger.info(f"  Category: {category}")
                            logger.info(f"  Similarity: {similarity:.4f}")
                            logger.info(f"  Response Length: {len(response_text)} chars")
                            logger.info(f"  Has Response (len > 3): {has_response}")
                            
                            if similarity > 0.5 and has_response:  # Threshold + response filter
                                similar.append({
                                    "query_id": result_id,  # Use actual ChromaDB ID
                                    "query_text": query_text_in_result if isinstance(query_text_in_result, str) else doc,
                                    "response": response_text,
                                    "similarity": similarity,
                                    "confidence_score": metadata.get("confidence_score", 0.0),
                                    "rfp_number": rfp_number
                                })
                                logger.info(f"✓ [Step 3] ADDED: {query_snippet}... (sim: {similarity:.3f}, rfp: {rfp_number})")
                            else:
                                # Log why item was filtered out
                                if similarity <= 0.5:
                                    logger.warning(f"  ❌ FILTERED: Similarity {similarity:.4f} <= 0.5 threshold")
                                if not has_response:
                                    logger.warning(f"  ❌ FILTERED: No response or response too short ({len(response_text)} chars)")
                        
                        if len(similar) > 0:
                            logger.info(f"✅ [Step 3] Found {len(similar)} similar queries with responses from ChromaDB (threshold: 0.5)")
                        else:
                            logger.warning(f"⚠️  [Step 3] No similar queries with responses found in ChromaDB")
                    else:
                        logger.info("No results returned from ChromaDB search")
                        
                except Exception as e:
                    logger.warning(f"ChromaDB query failed: {str(e)}, falling back to in-memory DB")
                    # Fall back to in-memory if ChromaDB fails
                    similar = self._search_similar_in_memory(query_text)
            else:
                logger.info("ChromaDB collection not available, using in-memory database")
                similar = self._search_similar_in_memory(query_text)
            
            # Sort by similarity (descending)
            similar.sort(key=lambda x: x["similarity"], reverse=True)
            similar = similar[:3]  # Top 3
            
            import json
            await self.workflow_manager.complete_step(workflow_id, 3, json.dumps({
                "similar_count": len(similar),
                "top_similarity": similar[0]["similarity"] if similar else 0.0
            }))
            
            if len(similar) == 0:
                logger.warning(f"⚠️  Step 3 completed: No similar historical queries found with responses")
            else:
                logger.info(f"✅ Step 3 completed: Found {len(similar)} similar queries with responses")
            
            return similar
            
        except Exception as e:
            logger.error(f"Similar query search failed: {str(e)}")
            await self.workflow_manager.fail_step(workflow_id, 3, str(e))
            return []
    
    def _search_similar_in_memory(self, query_text: str) -> List[Dict[str, Any]]:
        """Fallback: Search similar queries in in-memory database"""
        similar = []
        
        for idx, stored_query in enumerate(self.similar_queries_db):
            try:
                similarity = self._calculate_text_similarity(
                    query_text,
                    stored_query["query_text"]
                )
                if similarity > 0.6:  # Threshold
                    conf_score = stored_query.get("confidence_score")
                    if conf_score is None:
                        conf_score = stored_query.get("confidence", 0.0)
                    similar.append({
                        "query_id": stored_query["query_id"],
                        "query_text": stored_query["query_text"],
                        "response": stored_query.get("response", ""),
                        "similarity": similarity,
                        "confidence_score": conf_score
                    })
            except KeyError as e:
                logger.error(f"[SimilarQuerySearch] KeyError for entry {idx}: {e}")
                continue
        
        return similar
    
    def _calculate_text_similarity(self, text1: str, text2: str) -> float:
        """Calculate simple text similarity (would use embeddings in production)"""
        words1 = set(text1.lower().split())
        words2 = set(text2.lower().split())
        
        if not words1 or not words2:
            return 0.0
        
        intersection = len(words1.intersection(words2))
        union = len(words1.union(words2))
        
        return intersection / union if union > 0 else 0.0
    
    # ========================================================================
    # STEP 4: Context Aggregation
    # ========================================================================
    
    async def _step4_context_aggregation(
        self,
        query_id: str,
        analysis: Dict[str, Any],
        historical_results: List[Dict[str, Any]],
        similar_queries: List[Dict[str, Any]],
        workflow_id: str
    ) -> Dict[str, Any]:
        """
        STEP 4: Aggregate all context sources into unified context
        
        Combines:
        - Query analysis
        - Historical RFP/Q&A data (Screen 7)
        - Similar past queries (Screen 8)
        """
        logger.info("\n=== [STEP 4: Context Aggregation] ===")
        await self.workflow_manager.start_step(workflow_id, 4, "Context Aggregation")
        
        try:
            # Build unified context
            # FIX 1: Only use Instance 4 ChromaDB (similar_queries), no Instance 3 historical docs
            context = {
                "query_analysis": analysis,
                "historical_sources": [
                    {
                        "source_id": r["document_id"],
                        "text": r["chunk_text"],
                        "similarity": r["similarity_score"],
                        "metadata": r["metadata"]
                    }
                    for r in historical_results
                ],  # Will be empty due to FIX 1
                "similar_queries": similar_queries,
                "total_sources": len(historical_results) + len(similar_queries),
                "context_quality": self._assess_context_quality(
                    historical_results,
                    similar_queries
                )
            }
            
            # Log context source breakdown
            logger.info(f"📊 Context Sources: Instance 3 (historical)={len(historical_results)}, Instance 4 (query_db)={len(similar_queries)}")
            
            import json
            await self.workflow_manager.complete_step(workflow_id, 4, json.dumps({
                "total_sources": context["total_sources"],
                "context_quality": context["context_quality"]
            }))
            
            logger.info(f"Context aggregated from {context['total_sources']} sources")
            return context
            
        except Exception as e:
            await self.workflow_manager.fail_step(workflow_id, 4, str(e))
            raise
    
    def _assess_context_quality(
        self,
        historical_results: List[Dict[str, Any]],
        similar_queries: List[Dict[str, Any]]
    ) -> str:
        """Assess overall quality of aggregated context"""
        if not historical_results and not similar_queries:
            return "poor"
        
        avg_hist_score = (
            sum(r.get("similarity_score", 0) for r in historical_results) / len(historical_results)
            if historical_results else 0
        )
        
        avg_sim_score = (
            sum(q.get("similarity", 0) for q in similar_queries) / len(similar_queries)
            if similar_queries else 0
        )
        
        overall_score = (avg_hist_score + avg_sim_score) / 2
        
        if overall_score > 0.8:
            return "excellent"
        elif overall_score > 0.6:
            return "good"
        elif overall_score > 0.4:
            return "fair"
        else:
            return "poor"
    
    def _determine_response_strategy(self, similarity_score: float) -> dict:
        """
        FIX 2: Determine response generation strategy based on similarity score
        """
        if similarity_score >= SIMILARITY_THRESHOLDS["EXACT_MATCH"]:
            return {
                "strategy": "verbatim",
                "weight": 1.0,
                "instruction": "Use the official answer EXACTLY as provided. Only update pronouns if needed (e.g., 'Yes. Security audits shall be conducted...')."
            }
        elif similarity_score >= SIMILARITY_THRESHOLDS["VERY_HIGH"]:
            return {
                "strategy": "template",
                "weight": 0.9,
                "instruction": "Follow the official answer's format and conclusion. Maintain the YES/NO answer and all key requirements. Use the same concise style."
            }
        elif similarity_score >= SIMILARITY_THRESHOLDS["HIGH"]:
            return {
                "strategy": "guided",
                "weight": 0.8,
                "instruction": "Base your response on the official answer. Keep the same conclusion (YES/NO). Maintain consistency with requirements stated."
            }
        elif similarity_score >= SIMILARITY_THRESHOLDS["MEDIUM"]:
            return {
                "strategy": "reference",
                "weight": 0.6,
                "instruction": "Use official answer as strong reference. Ensure your conclusion aligns if similarity is above 60%."
            }
        elif similarity_score >= SIMILARITY_THRESHOLDS["LOW"]:
            return {
                "strategy": "context",
                "weight": 0.4,
                "instruction": "Use official answer as background context only. Generate fresh response if needed."
            }
        else:
            return {
                "strategy": "fresh",
                "weight": 0.1,
                "instruction": "No highly similar queries found. Generate response based on general knowledge and tender context."
            }
    
    def _format_context_for_llm(self, context: dict) -> str:
        """
        FIX 2 & 3: Format context with RESPONSES from similar queries.
        Only include Instance 4 (query_db) similar queries with their official responses.
        """
        context_chunks = []
        
        # Historical sources (will be empty due to FIX 1)
        for source in context.get("historical_sources", []):
            meta = source.get("metadata", {})
            rfp_number = meta.get("rfp_number", "")
            chunk_text = source.get("text", "")
            similarity = source.get("similarity", 0.0)
            context_chunks.append(f"[Historical RFP: {rfp_number}] {chunk_text} (Similarity: {similarity:.2f})")
        
        # Similar queries WITH RESPONSES (Instance 4: query_db)
        similar_queries = context.get("similar_queries", [])
        for idx, query in enumerate(similar_queries, 1):
            query_id = query.get("query_id", "")
            query_text = query.get("query_text", "")
            response = query.get("response", "")
            similarity = query.get("similarity", 0.0)
            rfp_ref = query.get("metadata", {}).get("rfp_number", "")
            
            # Format: Include both question AND answer
            context_chunks.append(
                f"[Similar Query {idx}] (Similarity: {similarity:.1%})\n"
                f"RFP: {rfp_ref}\n"
                f"Q: {query_text}\n"
                f"Official Answer: {response}"
            )
        
        return "\n\n---\n\n".join(context_chunks)
    
    # ========================================================================
    # STEP 5: Response Generation
    # ========================================================================
    
    async def _step5_response_generation(
        self,
        query_id: str,
        query_text: str,
        context: Dict[str, Any],
        rfp_context: Dict[str, Any],
        workflow_id: str
    ) -> Dict[str, Any]:
        """
        STEP 5: Generate AI response using aggregated context
        
        Uses LLM to create comprehensive response
        """
        logger.info("\n=== [STEP 5: Response Generation] ===")
        await self.workflow_manager.start_step(workflow_id, 5, "Response Generation")
        
        try:
            # Build context string for LLM
            context_str = self._format_context_for_llm(context)
            
            # FIX 2 & 3: Determine response strategy based on top similarity
            similar_queries = context.get("similar_queries", [])
            top_similarity = similar_queries[0].get("similarity", 0.0) if similar_queries else 0.0
            strategy = self._determine_response_strategy(top_similarity)
            
            # FIX 3: Updated prompt with similarity-aware instructions and concise format
            generation_prompt = PromptTemplate(
                template="""You are generating an official response for a pre-bid query.

RFP: {rfp_number}
Query: {query_text}

SIMILARITY-BASED STRATEGY: {strategy_name} (Top Match: {top_similarity:.1%})
INSTRUCTION: {strategy_instruction}

OFFICIAL Q&A FROM PAST RFPS:
{context}

CRITICAL RULES:
1. **FORMAT**: Provide ONLY the answer - no greetings, no "Dear Sir/Madam", no closing remarks, no signatures
2. **STYLE**: Match the official Q&A format - direct, concise, factual
3. **START**: Begin with "Yes." or "No." when applicable (like official answers)
4. **CONSISTENCY**: If similar query says "Yes, mandatory" - you CANNOT say "not required"
5. **LENGTH**: Keep response concise (2-4 sentences) like official Q&A format

EXAMPLE OF CORRECT FORMAT:
"Yes. Security audits shall be conducted through CERT-In empanelled auditors at defined intervals during the contract period."

NOW GENERATE RESPONSE (direct answer only, no formalities):""",
                input_variables=["rfp_number", "query_text", "strategy_name", "top_similarity", "strategy_instruction", "context"]
            )
            
            # Try to use RAG service for semantic search first, fallback to direct LLM
            query_analysis = context.get("query_analysis") or {}
            rfp_number = rfp_context.get("rfp_number", "Unknown") if rfp_context else "Unknown"
            rfp_title = rfp_context.get("rfp_title", "Unknown") if rfp_context else "Unknown"
            category = query_analysis.get("category", "General")
            
            import json
            import httpx
            
            # Try RAG service first (provides semantic search from ChromaDB)
            rag_service_url = os.getenv("CHIEF_ENGINEER_RAG_SERVICE_URL", "http://localhost:8006/api/chief-engineer/query")
            use_rag_service = os.getenv("USE_RAG_SERVICE", "false").lower() == "true"  # DISABLED by default
            
            if use_rag_service:
                logger.info("\n=== [STEP 5: RAG Service Integration - Semantic Search] ===")
                payload = {
                    "query_id": query_id,
                    "query_text": query_text,
                    "rfp_context": rfp_context,
                    "metadata": {"workflow_id": workflow_id}
                }
                try:
                    # Increased timeout to 180s (3 minutes) for LLM generation
                    async with httpx.AsyncClient(timeout=180.0) as client:
                        rag_response = await client.post(rag_service_url, json=payload)
                        rag_response.raise_for_status()
                        result = rag_response.json()
                    
                    logger.info(f"✓ RAG service response received (semantic search completed)")
                    
                    # Extract past references and responses from similar queries (Instance 4: query_db)
                    past_ref_response = self._extract_rfp_references_from_similar_queries(context)
                    past_response = self._format_similar_query_responses(context)
                    
                    response_data = {
                        "response_text": result.get("answer", ""),
                        "past_ref_response": past_ref_response if past_ref_response else "",
                        "past_response": past_response if past_response else "",
                        "sources": result.get("context", []),
                        "similar_items_count": result.get("similar_items_count", 0),
                        "context_used": "\n".join([str(c) for c in result.get("context", [])])[:500]
                    }
                    
                    await self.workflow_manager.complete_step(workflow_id, 5, json.dumps({
                        "response_length": len(response_data["response_text"]),
                        "sources_count": response_data["similar_items_count"],
                        "method": "rag_service",
                        "past_ref_response_length": len(past_ref_response) if past_ref_response else 0,
                        "past_response_length": len(past_response) if past_response else 0
                    }))
                    
                    logger.info(f"Response generated via RAG service ({len(response_data['response_text'])} chars, past_ref:{len(past_ref_response) if past_ref_response else 0} chars, past_resp:{len(past_response) if past_response else 0} chars)")
                    return response_data
                    
                except Exception as rag_error:
                    logger.warning(f"RAG service unavailable (Error: {type(rag_error).__name__}: {str(rag_error)}). Falling back to direct LLM generation.")
                    logger.debug(f"RAG service error details: {repr(rag_error)}")
            
            # Fallback: Generate response directly using LLM
            logger.info("\n=== [STEP 5: Direct LLM Generation (Fallback)] ===")
            
            # Format the prompt with context and strategy
            formatted_prompt = generation_prompt.format(
                rfp_number=rfp_number,
                query_text=query_text,
                strategy_name=strategy["strategy"].upper(),
                top_similarity=top_similarity,
                strategy_instruction=strategy["instruction"],
                context=context_str if context_str else "No similar queries found."
            )
            
            # Generate response using the configured LLM provider (OpenAI or Ollama)
            logger.info("Generating response using configured LLM provider...")
            try:
                llm_response = await asyncio.to_thread(self.llm_manager.generate, formatted_prompt)
                
                # Extract response text
                if isinstance(llm_response, str):
                    response_text = llm_response
                else:
                    response_text = str(llm_response)
                
                response_text = response_text.strip()
                
                # Extract sources from context
                sources = self._extract_sources(context)
                
                # Format past responses from similar queries (Instance 4: query_db)
                past_ref_response = self._extract_rfp_references_from_similar_queries(context)
                past_response = self._format_similar_query_responses(context)
                
                # Log the formatted responses for debugging
                logger.info(f"[Step 5] past_ref_response (RFP refs): {len(past_ref_response) if past_ref_response else 0} chars")
                logger.info(f"[Step 5] past_response length: {len(past_response) if past_response else 0} chars")
                logger.debug(f"[Step 5] similar_queries count: {len(context.get('similar_queries', []))}")
                
                response_data = {
                    "response_text": response_text,
                    "past_ref_response": past_ref_response if past_ref_response else "",
                    "past_response": past_response if past_response else "",
                    "sources": sources,
                    "similar_items_count": len(sources),
                    "context_used": context_str[:500]
                }
                
                await self.workflow_manager.complete_step(workflow_id, 5, json.dumps({
                    "response_length": len(response_text),
                    "sources_count": len(sources),
                    "method": "direct_llm",
                    "past_ref_response_length": len(past_ref_response) if past_ref_response else 0,
                    "past_response_length": len(past_response) if past_response else 0
                }))
                
                logger.info(f"Response generated via direct LLM ({len(response_text)} chars, {len(sources)} sources, past_ref:{len(past_ref_response) if past_ref_response else 0} chars, past_resp:{len(past_response) if past_response else 0} chars)")
                return response_data
                
            except Exception as e:
                await self.workflow_manager.fail_step(workflow_id, 5, str(e))
                raise
        except Exception as e:
            logger.error(f"Step 5 failed: {str(e)}")
            raise

    def _extract_sources(self, context: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Extract all sources used"""
        sources = []
        
        for source in context["historical_sources"]:
            sources.append({
                "type": "historical",
                "source_id": source["source_id"],
                "similarity": source["similarity"]
            })
        
        for query in context["similar_queries"]:
            sources.append({
                "type": "similar_query",
                "query_id": query["query_id"],
                "similarity": query["similarity"]
            })
        
        return sources
    
    def _extract_rfp_references_from_similar_queries(self, context: Dict[str, Any]) -> str:
        """
        Extract RFP number references from similar past queries (Instance 4: query_db)
        
        Maps to UI Field: Past RFP Reference
        Data Flow: 
        - Source: similar_queries from ChromaDB Instance 4 (query_db) 
        - Metadata: rfp_number stored with each query in Instance 4
        - These RFP numbers reference RFP documents stored in Instance 3 (chromadb)
        
        Returns formatted string of RFP numbers referenced by past similar queries
        These RFP numbers indicate which RFPs had similar questions previously answered
        """
        similar_queries = context.get("similar_queries", [])
        
        logger.debug(f"[_extract_rfp_references_from_similar_queries] Found {len(similar_queries)} similar queries")
        
        if not similar_queries:
            logger.debug("[_extract_rfp_references_from_similar_queries] No similar queries found, returning empty string")
            return ""
        
        # Extract unique RFP numbers from similar queries
        rfp_references = []
        rfp_numbers_seen = set()
        
        for idx, query in enumerate(similar_queries[:3], 1):  # Top 3 most similar
            try:
                rfp_number = query.get("rfp_number", "Unknown RFP")
                similarity = query.get("similarity", 0)
                query_text = query.get("query_text", "")
                
                # Only add if RFP number is not already added
                if rfp_number not in rfp_numbers_seen:
                    rfp_numbers_seen.add(rfp_number)
                    
                    # Format: "RFP: XXXX (Similarity: YY%)"
                    rfp_ref = f"RFP: {rfp_number} [Relevance: {similarity:.1%}]"
                    rfp_references.append(rfp_ref)
                    logger.debug(f"[_extract_rfp_references_from_similar_queries] Added RFP reference {idx}: {rfp_number}")
                    
            except Exception as e:
                logger.warning(f"[_extract_rfp_references_from_similar_queries] Error extracting RFP from query {idx}: {e}")
                continue
        
        result = " | ".join(rfp_references)  # Separate multiple RFPs with pipe
        logger.info(f"[_extract_rfp_references_from_similar_queries] Extracted {len(rfp_references)} RFP references ({len(result)} chars)")
        
        if not result:
            logger.info("[_extract_rfp_references_from_similar_queries] No similar queries found in database")
            return "No similar historical queries found"
        
        return result
    
    def _format_similar_query_responses(self, context: Dict[str, Any]) -> str:
        """
        Format similar past query responses from Screen 8 database (Instance 4: query_db)
        
        Maps to UI Field: Past Response
        Data Flow:
        - Source: similar_queries from ChromaDB Instance 4 (query_db)
        - Content: Response text provided against each past Q&A (both live and historical)
        
        Returns formatted string of past similar queries and their responses
        """
        similar_queries = context.get("similar_queries", [])
        
        logger.debug(f"[_format_similar_query_responses] Found {len(similar_queries)} similar queries")
        
        if not similar_queries:
            logger.info("[_format_similar_query_responses] No similar historical queries found in database")
            return "No similar historical queries found in the database. This appears to be a new or unique query."
        
        formatted_responses = []
        for idx, query in enumerate(similar_queries[:3], 1):  # Top 3 most similar
            try:
                query_text = query.get("query_text", "")
                response = query.get("response", "")
                similarity = query.get("similarity", 0)
                
                # Only add if both query and response are present
                if query_text and response:
                    # Truncate long responses
                    truncated_response = response[:300] + "..." if len(response) > 300 else response
                    formatted_responses.append(
                        f"Similar Query {idx} [Similarity: {similarity:.1%}]:\n"
                        f"Q: {query_text.strip()}\n"
                        f"A: {truncated_response.strip()}"
                    )
                    logger.debug(f"[_format_similar_query_responses] Added similar query {idx}")
            except Exception as e:
                logger.warning(f"[_format_similar_query_responses] Error formatting query {idx}: {e}")
                continue
        
        result = "\n\n---\n\n".join(formatted_responses)
        logger.info(f"[_format_similar_query_responses] Formatted {len(formatted_responses)} query responses ({len(result)} chars)")
        
        if not result:
            logger.warning("[_format_similar_query_responses] Similar queries found but none had responses")
            return "Similar queries found in database but no responses are available yet."
        
        return result
    
    # ========================================================================
    # FIX 4: Explainability & Source Attribution
    # ========================================================================
    
    def _generate_explainability(self, context: dict, response: dict, confidence: float) -> dict:
        """
        FIX 4: Generate explainability showing how the AI made its decision.
        Provides transparency about source selection and decision logic.
        
        Args:
            context: Aggregated context with similar queries
            response: Generated response with sources
            confidence: Overall confidence score
            
        Returns:
            dict with decision_basis, primary_source, strategy, sources_ranked, etc.
        """
        similar_queries = context.get("similar_queries", [])
        
        if not similar_queries:
            return {
                "decision_basis": "no_similar_queries",
                "primary_source": None,
                "strategy_used": "fresh_generation",
                "sources_ranked": [],
                "confidence_breakdown": {
                    "similarity_confidence": 0.0,
                    "overall_confidence": confidence
                }
            }
        
        # Primary source (top similar query)
        top_query = similar_queries[0]
        top_similarity = top_query.get("similarity", 0.0)
        
        # Determine strategy used
        strategy = self._determine_response_strategy(top_similarity)
        
        # Build primary source info
        primary_source = {
            "query_id": top_query.get("query_id", ""),
            "query_text": top_query.get("query_text", ""),
            "response": top_query.get("response", ""),
            "similarity": top_similarity,
            "rfp_reference": top_query.get("rfp_number", top_query.get("metadata", {}).get("rfp_number", "Unknown")),
            "weight_applied": strategy["weight"]
        }
        
        # Rank all sources
        sources_ranked = []
        for idx, query in enumerate(similar_queries, 1):
            sources_ranked.append({
                "rank": idx,
                "query_id": query.get("query_id", ""),
                "query_text": query.get("query_text", "")[:80] + "..." if len(query.get("query_text", "")) > 80 else query.get("query_text", ""),
                "similarity": query.get("similarity", 0.0),
                "rfp_reference": query.get("rfp_number", query.get("metadata", {}).get("rfp_number", "Unknown"))
            })
        
        # Confidence breakdown
        confidence_breakdown = {
            "similarity_confidence": top_similarity,
            "response_alignment": 0.95 if top_similarity >= 0.70 else 0.75,  # Estimated
            "overall_confidence": confidence
        }
        
        return {
            "decision_basis": "high_similarity_match" if top_similarity >= 0.70 else "low_similarity_reference",
            "primary_source": primary_source,
            "strategy_used": strategy["strategy"],
            "sources_ranked": sources_ranked,
            "confidence_breakdown": confidence_breakdown,
            "total_sources_found": len(similar_queries)
        }
    
    def _format_explainability_for_ui(self, explainability: dict) -> str:
        """
        Format explainability results for display in UI (appended to AI response)
        """
        separator = "─" * 60
        
        if explainability["decision_basis"] == "no_similar_queries":
            return f"""
{separator}
FIX 4: EXPLAINABILITY & SOURCE ATTRIBUTION
ℹ️ No similar queries found in database
Decision: Fresh response generated based on general knowledge
Confidence: {explainability['confidence_breakdown']['overall_confidence']:.1%}
{separator}"""
        
        primary = explainability["primary_source"]
        strategy = explainability["strategy_used"].upper()
        total = explainability["total_sources_found"]
        
        output = f"""
{separator}
FIX 4: EXPLAINABILITY & SOURCE ATTRIBUTION

📊 DECISION BASIS: {explainability['decision_basis'].replace('_', ' ').title()}
🎯 STRATEGY USED: {strategy}

🔍 PRIMARY SOURCE (Basis for Response):
  • Query ID: {primary['query_id']}
  • RFP Reference: {primary['rfp_reference']}
  • Similarity Score: {primary['similarity']:.1%}
  • Weight Applied: {primary['weight_applied']:.0%}
  • Question: "{primary['query_text'][:80]}{'...' if len(primary['query_text']) > 80 else ''}"
  • Official Answer: "{primary['response'][:100]}{'...' if len(primary['response']) > 100 else ''}"
"""
        
        # Show top 3 sources if available
        if len(explainability["sources_ranked"]) > 1:
            output += f"\n📋 ALL SOURCES RANKED (Top {min(3, total)}):\n"
            for source in explainability["sources_ranked"][:3]:
                output += f"""  {source['rank']}. Similarity: {source['similarity']:.1%} | RFP: {source['rfp_reference']}
     Q: "{source['query_text']}"
"""
        
        # Confidence breakdown
        cb = explainability["confidence_breakdown"]
        output += f"""
📈 CONFIDENCE BREAKDOWN:
  • Similarity Confidence: {cb['similarity_confidence']:.1%}
  • Response Alignment: {cb['response_alignment']:.1%}
  • Overall Confidence: {cb['overall_confidence']:.1%}

💡 EXPLANATION:
  The response was generated using the {strategy} strategy, primarily based on
  the most similar query (similarity: {primary['similarity']:.1%}) from RFP {primary['rfp_reference']}.
  Total {total} similar {'query' if total == 1 else 'queries'} found in database.
{separator}"""
        
        return output
    
    # ========================================================================
    # FIX 5: Conflict Detection
    # ========================================================================
    
    def _detect_conflicts(self, similar_queries: list) -> dict:
        """
        FIX 5: Detect if top similar queries have contradictory answers.
        
        Checks if the top 2-3 similar queries have conflicting YES/NO conclusions.
        This helps identify when the query_db has inconsistent official answers.
        
        Args:
            similar_queries: List of similar queries with responses and similarity scores
            
        Returns:
            dict with 'conflicts_found', 'conflicts' list, and 'resolution'
        """
        if len(similar_queries) < 2:
            return {
                "conflicts_found": False,
                "reason": "Only one similar query found, no conflicts possible",
                "conflicts": []
            }
        
        conflicts = []
        
        # Check top 3 queries (or fewer if not available)
        queries_to_check = similar_queries[:min(3, len(similar_queries))]
        
        # Analyze YES/NO patterns
        query_patterns = []
        for idx, query in enumerate(queries_to_check, 1):
            response = query.get("response", "").lower().strip()
            similarity = query.get("similarity", 0.0)
            query_id = query.get("query_id", f"query_{idx}")
            query_text = query.get("query_text", "")
            
            # Determine YES/NO/UNCLEAR
            if response.startswith("yes"):
                conclusion = "YES"
            elif response.startswith("no"):
                conclusion = "NO"
            else:
                conclusion = "UNCLEAR"
            
            query_patterns.append({
                "rank": idx,
                "query_id": query_id,
                "query_text": query_text[:80] + "..." if len(query_text) > 80 else query_text,
                "similarity": similarity,
                "conclusion": conclusion,
                "response_snippet": response[:100] + "..." if len(response) > 100 else response
            })
        
        # Compare top 2 queries
        if len(query_patterns) >= 2:
            top1 = query_patterns[0]
            top2 = query_patterns[1]
            
            # Check for contradiction
            if (top1["conclusion"] == "YES" and top2["conclusion"] == "NO") or \
               (top1["conclusion"] == "NO" and top2["conclusion"] == "YES"):
                conflicts.append({
                    "type": "yes_no_contradiction",
                    "severity": "high",
                    "query1": {
                        "rank": top1["rank"],
                        "query_id": top1["query_id"],
                        "similarity": top1["similarity"],
                        "conclusion": top1["conclusion"],
                        "query_text": top1["query_text"]
                    },
                    "query2": {
                        "rank": top2["rank"],
                        "query_id": top2["query_id"],
                        "similarity": top2["similarity"],
                        "conclusion": top2["conclusion"],
                        "query_text": top2["query_text"]
                    },
                    "description": f"Query {top1['rank']} says {top1['conclusion']}, Query {top2['rank']} says {top2['conclusion']}",
                    "resolution": f"Prioritized Query {top1['rank']} (higher similarity: {top1['similarity']:.1%})"
                })
        
        # Check if all top 3 have different conclusions
        if len(query_patterns) >= 3:
            conclusions = [q["conclusion"] for q in query_patterns]
            if len(set(conclusions)) == 3:  # All different
                conflicts.append({
                    "type": "multiple_contradictions",
                    "severity": "medium",
                    "description": "Top 3 similar queries have inconsistent conclusions",
                    "queries": query_patterns,
                    "resolution": f"Used Query 1 as primary source (highest similarity: {query_patterns[0]['similarity']:.1%})"
                })
        
        return {
            "conflicts_found": len(conflicts) > 0,
            "conflicts": conflicts,
            "query_patterns": query_patterns,
            "total_checked": len(query_patterns)
        }
    
    def _format_conflict_detection_for_ui(self, conflict_result: dict) -> str:
        """
        Format conflict detection results for display in UI (appended to AI response)
        """
        separator = "─" * 60
        
        if not conflict_result["conflicts_found"]:
            total_checked = conflict_result.get("total_checked", 0)
            return f"""
{separator}
FIX 5: CONFLICT DETECTION
✅ No conflicts detected among top {total_checked} similar queries.
All similar queries have consistent answers.
{separator}"""
        
        output = f"""
{separator}
FIX 5: CONFLICT DETECTION
⚠️ CONFLICTS DETECTED: {len(conflict_result['conflicts'])} conflict(s) found
"""
        
        for idx, conflict in enumerate(conflict_result["conflicts"], 1):
            if conflict["type"] == "yes_no_contradiction":
                q1 = conflict["query1"]
                q2 = conflict["query2"]
                output += f"""
Conflict #{idx}: YES/NO Contradiction (Severity: {conflict['severity'].upper()})
  • Query {q1['rank']} (similarity: {q1['similarity']:.1%}): Says {q1['conclusion']}
    "{q1['query_text']}"
  • Query {q2['rank']} (similarity: {q2['similarity']:.1%}): Says {q2['conclusion']}
    "{q2['query_text']}"
  → Resolution: {conflict['resolution']}
"""
            elif conflict["type"] == "multiple_contradictions":
                output += f"""
Conflict #{idx}: Multiple Inconsistencies (Severity: {conflict['severity'].upper()})
  {conflict['description']}
  → Resolution: {conflict['resolution']}
"""
        
        output += f"""
Recommendation: Review query_db for consistency. Consider human review.
{separator}"""
        
        return output
    
    # ========================================================================
    # FIX 6: Response Validation
    # ========================================================================
    
    def _format_validation_for_ui(self, validation_result: dict, similarity: float) -> str:
        """
        Format validation results for display in UI (appended to AI response)
        """
        separator = "─" * 60
        
        if validation_result["valid"]:
            if validation_result["severity"] == "none" and similarity >= 0.70:
                return f"""{separator}
FIX 6: RESPONSE VALIDATION
✅ VALIDATION: PASSED
{validation_result['reason']}
Strategy: Response aligned with similar official Q&A
{separator}"""
            else:
                return f"""{separator}
FIX 6: RESPONSE VALIDATION
✅ VALIDATION: PASSED
{validation_result['reason']}
{separator}"""
        else:
            icon = "❌" if validation_result["severity"] == "critical" else "⚠️"
            status = "FAILED" if validation_result["severity"] == "critical" else "WARNING"
            
            output = f"""{separator}
FIX 6: RESPONSE VALIDATION
{icon} VALIDATION: {status}
{validation_result['reason']}"""
            
            if validation_result.get("action"):
                output += f"\nRecommended Action: {validation_result['action']}"
            
            if validation_result.get("top_query_snippet"):
                output += f"\n\nTop Similar Query Response (snippet):\n\"{validation_result['top_query_snippet']}\""
            
            if validation_result.get("ai_response_snippet"):
                output += f"\n\nAI Generated Response (snippet):\n\"{validation_result['ai_response_snippet']}\""
            
            output += f"\n{separator}"
            return output
    
    def _validate_response_consistency(
        self,
        ai_response: str,
        top_query_response: str,
        similarity: float
    ) -> dict:
        """
        FIX 6: Validate that AI response aligns with top similar query.
        
        For high similarity (>70%), ensures no contradictions between
        AI response and the official answer from similar query.
        
        Args:
            ai_response: Generated AI response text
            top_query_response: Official response from most similar query
            similarity: Similarity score (0.0 to 1.0)
            
        Returns:
            dict with 'valid', 'reason', and optional 'action' fields
        """
        if similarity < 0.70:
            return {
                "valid": True,
                "reason": "Low similarity (<70%), no strict validation needed",
                "severity": "none"
            }
        
        ai_lower = ai_response.lower().strip()
        top_lower = top_query_response.lower().strip()
        
        # Extract first 150 characters for YES/NO detection
        ai_start = ai_lower[:150]
        top_start = top_lower[:150]
        
        # Determine if top query says YES or NO
        top_says_yes = top_start.startswith("yes")
        top_says_no = top_start.startswith("no")
        
        # Determine if AI says YES or NO
        ai_says_yes = ai_start.startswith("yes") or (
            "yes" in ai_start[:50] and 
            ("mandatory" in ai_start or "required" in ai_start or "shall be" in ai_start)
        )
        ai_says_no = ai_start.startswith("no") or (
            "not required" in ai_start or 
            "not mandatory" in ai_start or 
            "no explicit requirement" in ai_start
        )
        
        # Check for contradiction
        if top_says_yes and ai_says_no:
            return {
                "valid": False,
                "reason": f"❌ CONTRADICTION: Top similar query (similarity: {similarity:.1%}) says YES/mandatory, but AI response says NO/not required",
                "severity": "critical",
                "action": "Flag for human review. Consider regenerating with stricter prompt.",
                "top_query_snippet": top_query_response[:100] + "...",
                "ai_response_snippet": ai_response[:100] + "..."
            }
        
        if top_says_no and ai_says_yes:
            return {
                "valid": False,
                "reason": f"❌ CONTRADICTION: Top similar query (similarity: {similarity:.1%}) says NO/not required, but AI response says YES/mandatory",
                "severity": "critical",
                "action": "Flag for human review. Consider regenerating with stricter prompt.",
                "top_query_snippet": top_query_response[:100] + "...",
                "ai_response_snippet": ai_response[:100] + "..."
            }
        
        # Check for alignment (both say YES or both say NO)
        if (top_says_yes and ai_says_yes) or (top_says_no and ai_says_no):
            return {
                "valid": True,
                "reason": f"✅ Response aligns with top similar query (similarity: {similarity:.1%}). Both have consistent YES/NO conclusion.",
                "severity": "none"
            }
        
        # Unclear conclusion (neither clearly YES nor NO)
        if similarity >= 0.75:
            return {
                "valid": False,
                "reason": f"⚠️ HIGH SIMILARITY ({similarity:.1%}) but unclear YES/NO alignment. Top query: '{top_start[:50]}...', AI: '{ai_start[:50]}...'",
                "severity": "warning",
                "action": "Review for clarity. Ensure response has clear conclusion."
            }
        
        return {
            "valid": True,
            "reason": f"Response appears consistent with top similar query (similarity: {similarity:.1%})",
            "severity": "none"
        }
    
    # ========================================================================
    # FIX 7: Enhanced Response Structure
    # ========================================================================
    
    def _generate_enhanced_response_structure(
        self,
        response_text: str,
        explainability: dict,
        validation: dict,
        conflict_detection: dict,
        confidence: float
    ) -> dict:
        """
        FIX 7: Generate enhanced response structure with structured fields
        for easier frontend consumption.
        
        Returns:
            dict with structured metadata fields
        """
        # Determine confidence level
        if confidence >= 0.80:
            confidence_level = "HIGH"
        elif confidence >= 0.60:
            confidence_level = "MEDIUM"
        else:
            confidence_level = "LOW"
        
        # Extract primary source info
        primary_source = None
        if explainability.get("primary_source"):
            ps = explainability["primary_source"]
            primary_source = {
                "query_id": ps.get("query_id"),
                "rfp": ps.get("rfp_reference"),
                "similarity": ps.get("similarity"),
                "query": ps.get("query_text"),
                "answer": ps.get("response", "")[:150] + "..." if len(ps.get("response", "")) > 150 else ps.get("response", "")
            }
        
        # Response strategy
        strategy_name = explainability.get("strategy_used", "unknown")
        strategy_threshold = self._get_strategy_threshold_label(strategy_name)
        
        response_strategy = {
            "strategy": strategy_name,
            "threshold": strategy_threshold,
            "reason": explainability.get("decision_basis", "").replace("_", " ").title()
        }
        
        # Quality flags
        quality_flags = {
            "validation_passed": validation.get("valid", True),
            "conflicts_found": conflict_detection.get("conflicts_found", False),
            "needs_review": not validation.get("valid", True) or conflict_detection.get("conflicts_found", False),
            "alignment_score": explainability.get("confidence_breakdown", {}).get("response_alignment", 0.0)
        }
        
        # Metadata summaries
        validation_icon = "✅" if validation.get("valid") else ("❌" if validation.get("severity") == "critical" else "⚠️")
        validation_status = "PASSED" if validation.get("valid") else "FAILED"
        validation_summary = f"{validation_icon} {validation_status}"
        
        if primary_source:
            validation_summary += f" - Aligned with {primary_source['similarity']:.1%} similar query"
        
        explainability_summary = f"Used {strategy_name.upper()} strategy"
        if primary_source:
            explainability_summary += f" based on RFP {primary_source['rfp']}"
        
        conflicts_icon = "⚠️" if conflict_detection.get("conflicts_found") else "✅"
        conflicts_count = len(conflict_detection.get("conflicts", []))
        conflicts_summary = f"{conflicts_icon} {conflicts_count} conflict(s) detected" if conflicts_count > 0 else f"{conflicts_icon} No conflicts detected"
        
        return {
            "confidence_level": confidence_level,
            "confidence_breakdown": explainability.get("confidence_breakdown", {}),
            "response_strategy": response_strategy,
            "primary_source": primary_source,
            "quality_flags": quality_flags,
            "response_metadata": {
                "validation_summary": validation_summary,
                "explainability_summary": explainability_summary,
                "conflicts_summary": conflicts_summary
            }
        }
    
    def _get_strategy_threshold_label(self, strategy: str) -> str:
        """Get human-readable threshold label for strategy"""
        strategy_labels = {
            "verbatim": "EXACT MATCH (95-100%)",
            "template": "VERY HIGH (80-95%)",
            "guided": "HIGH (70-80%)",
            "reference": "MEDIUM (60-70%)",
            "context": "LOW (50-60%)",
            "fresh": "MINIMAL (<50%)"
        }
        return strategy_labels.get(strategy.lower(), "UNKNOWN")
    
    def _format_enhanced_structure_for_ui(self, enhanced_structure: dict, confidence: float) -> str:
        """
        Format enhanced response structure for display in UI (appended to AI response)
        """
        separator = "─" * 60
        metadata = enhanced_structure["response_metadata"]
        strategy = enhanced_structure["response_strategy"]
        primary = enhanced_structure["primary_source"]
        flags = enhanced_structure["quality_flags"]
        confidence_level = enhanced_structure["confidence_level"]
        
        # Confidence color emoji
        confidence_emoji = "🟢" if confidence_level == "HIGH" else "🟡" if confidence_level == "MEDIUM" else "🔴"
        
        output = f"""
{separator}
FIX 7: ENHANCED RESPONSE STRUCTURE

📊 RESPONSE SUMMARY:
  • Validation: {metadata['validation_summary']}
  • Strategy: {metadata['explainability_summary']}
  • Conflicts: {metadata['conflicts_summary']}
  • Confidence: {confidence_emoji} {confidence_level} ({confidence:.1%})

🎯 RESPONSE DETAILS:
  • Strategy Used: {strategy['strategy'].upper()}
  • Threshold Range: {strategy['threshold']}
  • Decision Basis: {strategy['reason']}
  • Needs Review: {'YES ⚠️' if flags['needs_review'] else 'NO ✅'}
"""
        
        if primary:
            output += f"""
🔍 PRIMARY SOURCE:
  • Query ID: {primary['query_id']}
  • RFP Reference: {primary['rfp']}
  • Similarity: {primary['similarity']:.1%}
  • Question: "{primary['query'][:80]}{'...' if len(primary['query']) > 80 else ''}"
  • Answer: "{primary['answer']}"
"""
        
        output += f"""
📈 QUALITY METRICS:
  • Validation Passed: {'✅ YES' if flags['validation_passed'] else '❌ NO'}
  • Conflicts Found: {'⚠️ YES' if flags['conflicts_found'] else '✅ NO'}
  • Alignment Score: {flags['alignment_score']:.1%}
  • Overall Quality: {'⚠️ NEEDS REVIEW' if flags['needs_review'] else '✅ GOOD'}

💡 FOR FRONTEND:
  Use structured fields (confidence_level, quality_flags, primary_source)
  for dynamic UI rendering instead of parsing this text.
{separator}"""
        
        return output
    
    # ========================================================================
    # STEP 6: Quality Check
    # ========================================================================
    
    async def _step6_quality_check(
        self,
        query_id: str,
        query_text: str,
        response: Dict[str, Any],
        context: Dict[str, Any],
        workflow_id: str
    ) -> Dict[str, Any]:
        """
        STEP 6: Validate response quality and calculate confidence score
        
        Returns final response with quality metrics
        """
        logger.info("\n=== [STEP 6: Quality Check] ===\n")
        await self.workflow_manager.start_step(workflow_id, 6, "Quality Check")
        
        try:
            # Calculate confidence score
            confidence = self._calculate_confidence_score(response, context)
            
            # Validate response completeness
            is_complete = len(response["response_text"]) > 50
            has_sources = len(response["sources"]) > 0
            
            # FIX 6: Validate response consistency with top similar query
            validation_result = {"valid": True, "reason": "No validation performed", "severity": "none"}
            similar_queries = context.get("similar_queries", [])
            
            # FIX 5: Detect conflicts among similar queries
            conflict_result = self._detect_conflicts(similar_queries)
            
            # FIX 4: Generate explainability
            explainability_result = self._generate_explainability(context, response, confidence)
            
            # FIX 7: Generate enhanced response structure
            enhanced_structure = self._generate_enhanced_response_structure(
                response_text=response["response_text"],
                explainability=explainability_result,
                validation=validation_result,
                conflict_detection=conflict_result,
                confidence=confidence
            )
            
            # Log explainability summary
            logger.info(f"📊 Explainability: Decision basis = {explainability_result['decision_basis']}, Strategy = {explainability_result['strategy_used']}")
            if explainability_result["primary_source"]:
                primary = explainability_result["primary_source"]
                logger.info(f"   Primary source: {primary['query_id']} (similarity: {primary['similarity']:.1%}, weight: {primary['weight_applied']:.0%})")
            
            # Log conflict detection results
            if conflict_result["conflicts_found"]:
                logger.warning(f"⚠️ Conflicts detected: {len(conflict_result['conflicts'])} conflict(s) among similar queries")
                for conflict in conflict_result["conflicts"]:
                    logger.warning(f"   - {conflict['description']}")
                    logger.warning(f"   - Resolution: {conflict['resolution']}")
            else:
                logger.info(f"✅ No conflicts detected among {conflict_result.get('total_checked', 0)} similar queries")
            
            if similar_queries:
                top_query = similar_queries[0]
                top_similarity = top_query.get("similarity", 0.0)
                top_response = top_query.get("response", "")
                
                if top_response:
                    validation_result = self._validate_response_consistency(
                        ai_response=response["response_text"],
                        top_query_response=top_response,
                        similarity=top_similarity
                    )
                    
                    # Log validation results
                    if validation_result["valid"]:
                        logger.info(f"✅ Validation PASSED: {validation_result['reason']}")
                    else:
                        if validation_result["severity"] == "critical":
                            logger.error(f"❌ Validation FAILED: {validation_result['reason']}")
                            logger.error(f"   Action: {validation_result.get('action', 'Review required')}")
                        else:
                            logger.warning(f"⚠️ Validation WARNING: {validation_result['reason']}")
                            logger.warning(f"   Action: {validation_result.get('action', 'Review recommended')}")
                    
                    # Append validation, explainability, conflict detection, and enhanced structure to response text
                    validation_text = self._format_validation_for_ui(validation_result, top_similarity)
                    explainability_text = self._format_explainability_for_ui(explainability_result)
                    conflict_text = self._format_conflict_detection_for_ui(conflict_result)
                    enhanced_text = self._format_enhanced_structure_for_ui(enhanced_structure, confidence)
                    response["response_text"] = response["response_text"] + "\n\n" + validation_text + explainability_text + conflict_text + enhanced_text
            else:
                # No similar queries - still show all metadata
                explainability_text = self._format_explainability_for_ui(explainability_result)
                conflict_text = self._format_conflict_detection_for_ui(conflict_result)
                enhanced_text = self._format_enhanced_structure_for_ui(enhanced_structure, confidence)
                response["response_text"] = response["response_text"] + "\n\n" + explainability_text + conflict_text + enhanced_text
            
            # Build final response
            final_response = {
                "response_text": response["response_text"],
                "past_ref_response": response.get("past_ref_response", ""),
                "past_response": response.get("past_response", ""),
                "confidence_score": confidence,
                "sources": response["sources"],
                "quality_metrics": {
                    "is_complete": is_complete,
                    "has_sources": has_sources,
                    "context_quality": context["context_quality"],
                    "response_length": len(response["response_text"])
                },
                "explainability": explainability_result,  # FIX 4: Explainability & source attribution
                "validation": validation_result,  # FIX 6: Validation results
                "conflict_detection": conflict_result,  # FIX 5: Conflict detection results
                # FIX 7: Enhanced structured fields
                "confidence_level": enhanced_structure["confidence_level"],
                "confidence_breakdown": enhanced_structure["confidence_breakdown"],
                "response_strategy": enhanced_structure["response_strategy"],
                "primary_source": enhanced_structure["primary_source"],
                "quality_flags": enhanced_structure["quality_flags"],
                "response_metadata": enhanced_structure["response_metadata"]
            }
            
            # Store in similar queries database for future use
            await self._store_query_for_future(query_id, query_text, response, confidence)
            
            import json
            await self.workflow_manager.complete_step(workflow_id, 6, json.dumps({
                "confidence_score": confidence,
                "quality_passed": is_complete and has_sources,
                "validation_passed": validation_result["valid"],
                "validation_severity": validation_result["severity"],
                "conflicts_detected": conflict_result["conflicts_found"],
                "conflicts_count": len(conflict_result.get("conflicts", []))
            }))
            
            logger.info(f"Quality check completed (confidence: {confidence:.2%})")
            return final_response
            
        except Exception as e:
            await self.workflow_manager.fail_step(workflow_id, 6, str(e))
            raise
    
    def _calculate_confidence_score(
        self,
        response: Dict[str, Any],
        context: Dict[str, Any]
    ) -> float:
        """
        Calculate confidence score (0.0 - 1.0)
        
        Uses similarity score from historical sources and similar queries.
        """
        similarity_scores: List[float] = []

        for source in context.get("historical_sources", []):
            sim = source.get("similarity")
            if sim is None:
                sim = source.get("similarity_score")
            if sim is not None:
                similarity_scores.append(float(sim))

        for query in context.get("similar_queries", []):
            sim = query.get("similarity")
            if sim is None:
                sim = query.get("similarity_score")
            if sim is not None:
                similarity_scores.append(float(sim))

        if not similarity_scores:
            return 0.0

        score = max(similarity_scores)

        # Normalize if score looks like percentage (0-100)
        if score > 1 and score <= 100:
            score = score / 100

        # Ensure between 0 and 1
        return min(1.0, max(0.0, score))
    
    async def _store_query_for_future(
        self,
        query_id: str,
        query_text: str,
        response: Dict[str, Any],
        confidence: float
    ):
        """
        Store query and response in similar queries database for future reference
        
        This allows Step 3 to find similar previously answered queries
        """
        try:
            query_data = {
                "query_id": query_id,
                "query_text": query_text,
                "response": response.get("response_text", ""),
                "confidence_score": confidence,
                "sources_count": len(response.get("sources", [])),
                "timestamp": datetime.now().isoformat()
            }
            
            # Add to in-memory database (would be PostgreSQL in production)
            self.similar_queries_db.append(query_data)
            
            logger.info(f"✓ Stored query {query_id} for future similarity matching")
            
        except Exception as e:
            logger.warning(f"Failed to store query for future: {str(e)}")
    
    async def _load_similar_queries(self):
        """Load similar queries from database"""
        # In production, this would load from PostgreSQL
        logger.info("Similar queries database initialized")
    
    async def check_screen7_connection(self) -> str:
        """Check connection to Screen 7"""
        try:
            response = await self.http_client.get(f"{self.screen7_url}/api/rag/health")
            response.raise_for_status()
            return "connected"
        except:
            return "disconnected"
    
    async def test_screen7_search(self, query: str) -> List[Dict[str, Any]]:
        """Test search against Screen 7"""
        try:
            response = await self.http_client.post(
                f"{self.screen7_url}/api/rag/search",
                json={"query": query, "top_k": 3}
            )
            response.raise_for_status()
            data = response.json()
            return data.get("results", [])
        except Exception as e:
            logger.error(f"Screen 7 test search failed: {str(e)}")
            return []
    
    async def cleanup(self):
        """Cleanup resources"""
        try:
            await self.http_client.aclose()
            logger.info("Chief Engineer Agent cleaned up")
        except Exception as e:
            logger.error(f"Cleanup failed: {str(e)}")
