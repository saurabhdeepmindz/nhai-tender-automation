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

from langchain_community.llms import Ollama
from langchain_core.prompts import PromptTemplate

from workflow_manager_pg import WorkflowManager

logger = logging.getLogger(__name__)

class ChiefEngineerAgent:
    """
    6-Step Agentic RAG Workflow for Pre-bid Query Processing
    
    This agent integrates with Screen 7 (Historical Data) to provide
    comprehensive, context-aware responses to vendor queries.
    """
    
    def __init__(self, screen7_url: str, workflow_manager: WorkflowManager):
        """
        Initialize Chief Engineer Agent
        
        Args:
            screen7_url: URL of Screen 7 History Retriever API
            workflow_manager: Workflow manager instance
        """
        self.screen7_url = screen7_url
        self.workflow_manager = workflow_manager
        
        # Initialize LLM
        self.llm = Ollama(
            model=os.getenv("LLM_MODEL", "llama2"),
            base_url=os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
        )
        
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
            
            # Step 2: Historical Search (Screen 7)
            historical_results = await self._step2_historical_search(
                query_id, query_text, rfp_context, workflow_id
            )

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
            
            # Generate analysis
            # Use the correct method to generate a response from Ollama
            response = await asyncio.to_thread(
                self.llm.generate,
                [
                    analysis_prompt.format(
                        rfp_context=str(rfp_context),
                        query_text=query_text
                    )
                ]
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
            # Call Screen 7 search API
            search_url = f"{self.screen7_url}/api/rag/search"
            
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
            
            response = await self.http_client.post(search_url, json=payload)
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
    
    async def _step3_similar_query_search(
        self,
        query_id: str,
        query_text: str,
        analysis: Dict[str, Any],
        workflow_id: str
    ) -> List[Dict[str, Any]]:
        """
        STEP 3: Find similar queries in Screen 8's own database
        
        This searches queries previously processed by Screen 8
        """
        logger.info("\n=== [STEP 3: Similar Query Search (Screen 8)] ===")
        await self.workflow_manager.start_step(workflow_id, 3, "Similar Query Search (Screen 8)")
        
        try:
            # Search similar queries in local database
            similar = []
            
            for idx, stored_query in enumerate(self.similar_queries_db):
                try:
                    logger.debug(f"[SimilarQuerySearch] Entry {idx}: {stored_query}")
                    similarity = self._calculate_text_similarity(
                        query_text,
                        stored_query["query_text"]
                    )
                    if similarity > 0.6:  # Threshold
                        # Backward compatibility: support both 'confidence_score' and legacy 'confidence'
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
                    logger.error(f"[SimilarQuerySearch] KeyError for entry {idx}: {e}. Entry: {stored_query}")
                    continue
            
            # Sort by similarity
            similar.sort(key=lambda x: x["similarity"], reverse=True)
            similar = similar[:3]  # Top 3
            
            import json
            await self.workflow_manager.complete_step(workflow_id, 3, json.dumps({
                "similar_count": len(similar),
                "top_similarity": similar[0]["similarity"] if similar else 0.0
            }))
            
            logger.info(f"Found {len(similar)} similar queries")
            return similar
            
        except Exception as e:
            logger.error(f"Similar query search failed: {str(e)}")
            await self.workflow_manager.fail_step(workflow_id, 3, str(e))
            return []
    
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
                ],
                "similar_queries": similar_queries,
                "total_sources": len(historical_results) + len(similar_queries),
                "context_quality": self._assess_context_quality(
                    historical_results,
                    similar_queries
                )
            }
            
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
            
            # LLM prompt for response generation
            generation_prompt = PromptTemplate(
                template="""You are a Chief Engineer responding to a pre-bid query for an NHAI highway project.

RFP: {rfp_number} - {rfp_title}
Category: {category}

Query: {query_text}

Available Context:
{context}

Generate a comprehensive, professional response that:
1. Directly addresses the query
2. References relevant tender clauses
3. Cites historical precedents if available
4. Maintains professional tone
5. Provides clear, actionable information

Response:""",
                input_variables=["rfp_number", "rfp_title", "category", "query_text", "context"]
            )
            
            # Generate response
            # Use the correct method to generate a response from Ollama
            query_analysis = context.get("query_analysis") or {}
            rfp_number = rfp_context.get("rfp_number", "Unknown") if rfp_context else "Unknown"
            rfp_title = rfp_context.get("rfp_title", "Unknown") if rfp_context else "Unknown"
            category = query_analysis.get("category", "General")
            
            import json
            import httpx
            logger.info("\n=== [STEP 5: RAG Service Integration] ===")
            rag_service_url = os.getenv("CHIEF_ENGINEER_RAG_SERVICE_URL", "http://localhost:8006/api/chief-engineer/query")
            payload = {
                "query_id": query_id,
                "query_text": query_text,
                "rfp_context": rfp_context,
                "metadata": {"workflow_id": workflow_id}
            }
            try:
                async with httpx.AsyncClient(timeout=60.0) as client:
                    rag_response = await client.post(rag_service_url, json=payload)
                    rag_response.raise_for_status()
                    result = rag_response.json()
                logger.info(f"RAG service response received for query {query_id}")
                response_data = {
                    "response_text": result.get("answer", ""),
                    "sources": result.get("context", []),
                    "similar_items_count": result.get("similar_items_count", 0),
                    "context_used": "\n".join(result.get("context", []))[:500]
                }
                await self.workflow_manager.complete_step(workflow_id, 5, json.dumps({
                    "response_length": len(response_data["response_text"]),
                    "sources_count": response_data["similar_items_count"]
                }))
                logger.info(f"Response generated ({len(response_data['response_text'])} chars)")
                return response_data
            except Exception as e:
                await self.workflow_manager.fail_step(workflow_id, 5, str(e))
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
        logger.info("\n=== [STEP 6: Quality Check] ===")
        await self.workflow_manager.start_step(workflow_id, 6, "Quality Check")
        
        try:
            # Calculate confidence score
            confidence = self._calculate_confidence_score(response, context)
            
            # Validate response completeness
            is_complete = len(response["response_text"]) > 50
            has_sources = len(response["sources"]) > 0
            
            # Build final response
            final_response = {
                "response_text": response["response_text"],
                "past_ref_response": response.get("past_ref_response"),
                "past_response": response.get("past_response"),
                "confidence_score": confidence,
                "sources": response["sources"],
                "quality_metrics": {
                    "is_complete": is_complete,
                    "has_sources": has_sources,
                    "context_quality": context["context_quality"],
                    "response_length": len(response["response_text"])
                }
            }
            
            # Store in similar queries database for future use
            await self._store_query_for_future(query_id, query_text, response, confidence)
            
            import json
            await self.workflow_manager.complete_step(workflow_id, 6, json.dumps({
                "confidence_score": confidence,
                "quality_passed": is_complete and has_sources
            }))
            
            logger.info(f"Quality check completed (confidence: {confidence})")
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
        
        Factors:
        - Context quality
        - Number of sources
        """
        # Example scoring logic (replace with your own)
        score = 0.5
        return score
    
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
