"""
Screen 8: Workflow Manager with PostgreSQL Persistence
NHAI AI-Driven Tender Query Automation System

Manages the 6-step agentic workflow execution with PostgreSQL persistence:
- Workflow creation and tracking
- Step status monitoring
- Performance metrics
- Real-time status updates for frontend visualization
- Production-ready with database audit trail

Author: NHAI Development Team
Version: 2.0.0 (Production-Ready PostgreSQL Implementation)
"""

import logging
from typing import Dict, List, Any, Optional
from datetime import datetime
import uuid
import asyncpg
from asyncpg.pool import Pool

from database import get_database

logger = logging.getLogger(__name__)

class WorkflowManager:
    """
    Manages workflows for Chief Engineer Agent with PostgreSQL persistence
    
    Tracks:
    - Workflow lifecycle (pending → in_progress → completed/failed)
    - Individual step execution
    - Performance metrics
    - Real-time status for frontend
    """
    
    # Workflow steps definition
    WORKFLOW_STEPS = [
        {"step_number": 1, "step_name": "Query Analysis"},
        {"step_number": 2, "step_name": "Historical Search (Screen 7)"},
        {"step_number": 3, "step_name": "Similar Query Search (Screen 8)"},
        {"step_number": 4, "step_name": "Context Aggregation"},
        {"step_number": 5, "step_name": "Response Generation"},
        {"step_number": 6, "step_name": "Quality Check"}
    ]
    
    def __init__(self):
        """Initialize Workflow Manager with PostgreSQL connection"""
        self.db_pool: Optional[Pool] = None
        logger.info("Workflow Manager (PostgreSQL) initialized")
    
    def set_db_pool(self, pool: Pool):
        """Set database connection pool"""
        self.db_pool = pool
        logger.info("Database pool set for WorkflowManager")
    
    # ========================================================================
    # Workflow Creation and Management
    # ========================================================================
    
    async def create_workflow(self, query_id: str) -> Dict[str, Any]:
        """
        Create a new workflow for a query in PostgreSQL
        
        Args:
            query_id: Unique query identifier
            
        Returns:
            Workflow object with tracking information
        """
        if not self.db_pool:
            raise RuntimeError("Database pool not initialized")
        
        workflow_id = str(uuid.uuid4())
        now = datetime.now()
        
        async with self.db_pool.acquire() as conn:
            # Insert workflow execution
            await conn.execute(
                """
                INSERT INTO workflow_executions (
                    workflow_id, query_id, status, current_step, total_steps,
                    created_at, updated_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7)
                """,
                workflow_id, query_id, "pending", 0, 6, now, now
            )
            
            # Insert workflow steps (all initially pending)
            for step in self.WORKFLOW_STEPS:
                await conn.execute(
                    """
                    INSERT INTO workflow_steps (
                        workflow_id, step_number, step_name, status,
                        created_at, updated_at
                    ) VALUES ($1, $2, $3, $4, $5, $6)
                    """,
                    workflow_id, step["step_number"], step["step_name"], "pending", now, now
                )
        
        logger.info(f"Created workflow {workflow_id} for query {query_id} in PostgreSQL")
        
        # Return workflow object
        workflow = await self.get_workflow(workflow_id)
        return workflow
    
    async def get_workflow(self, workflow_id: str) -> Optional[Dict[str, Any]]:
        """
        Get workflow by ID from PostgreSQL
        
        Args:
            workflow_id: Workflow identifier
            
        Returns:
            Workflow object with steps or None if not found
        """
        if not self.db_pool:
            raise RuntimeError("Database pool not initialized")
        
        async with self.db_pool.acquire() as conn:
            # Get workflow execution
            workflow_row = await conn.fetchrow(
                """
                SELECT workflow_id, query_id, status, current_step, total_steps,
                       processing_start, processing_end, total_duration_ms,
                       final_result, error_message, created_at, updated_at
                FROM workflow_executions
                WHERE workflow_id = $1
                """,
                workflow_id
            )
            
            if not workflow_row:
                return None
            
            # Get workflow steps
            steps_rows = await conn.fetch(
                """
                SELECT step_id, step_number, step_name, status, start_time, end_time,
                       duration_ms, result, error_message, created_at, updated_at
                FROM workflow_steps
                WHERE workflow_id = $1
                ORDER BY step_number
                """,
                workflow_id
            )
            
            # Build workflow object
            workflow = {
                "workflow_id": workflow_row["workflow_id"],
                "query_id": str(workflow_row["query_id"]),
                "status": workflow_row["status"],
                "current_step": workflow_row["current_step"],
                "total_steps": workflow_row["total_steps"],
                "processing_start": workflow_row["processing_start"].isoformat() if workflow_row["processing_start"] else None,
                "processing_end": workflow_row["processing_end"].isoformat() if workflow_row["processing_end"] else None,
                "total_duration_ms": float(workflow_row["total_duration_ms"]) if workflow_row["total_duration_ms"] else None,
                "final_result": workflow_row["final_result"],
                "error_message": workflow_row["error_message"],
                "created_at": workflow_row["created_at"].isoformat(),
                "updated_at": workflow_row["updated_at"].isoformat(),
                "steps": [
                    {
                        "step_id": step["step_id"],
                        "step_number": step["step_number"],
                        "step_name": step["step_name"],
                        "status": step["status"],
                        "start_time": step["start_time"].isoformat() if step["start_time"] else None,
                        "end_time": step["end_time"].isoformat() if step["end_time"] else None,
                        "duration_ms": float(step["duration_ms"]) if step["duration_ms"] else None,
                        "result": step["result"],
                        "error_message": step["error_message"],
                        "created_at": step["created_at"].isoformat(),
                        "updated_at": step["updated_at"].isoformat()
                    }
                    for step in steps_rows
                ]
            }
            
            return workflow
    
    async def get_workflow_by_query(self, query_id: str) -> Optional[Dict[str, Any]]:
        """
        Get workflow by query ID from PostgreSQL
        
        Args:
            query_id: Query identifier
            
        Returns:
            Workflow object or None if not found
        """
        if not self.db_pool:
            raise RuntimeError("Database pool not initialized")
        
        async with self.db_pool.acquire() as conn:
            workflow_row = await conn.fetchrow(
                """
                SELECT workflow_id
                FROM workflow_executions
                WHERE query_id = $1
                ORDER BY created_at DESC
                LIMIT 1
                """,
                query_id
            )
            
            if not workflow_row:
                return None
            
            return await self.get_workflow(workflow_row["workflow_id"])
    
    async def list_workflows(
        self,
        status: Optional[str] = None,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """
        List workflows with optional filtering from PostgreSQL
        
        Args:
            status: Filter by status (pending, in_progress, completed, failed)
            limit: Maximum number to return
            
        Returns:
            List of workflow objects (without steps for performance)
        """
        if not self.db_pool:
            raise RuntimeError("Database pool not initialized")
        
        async with self.db_pool.acquire() as conn:
            query = """
                SELECT workflow_id, query_id, status, current_step, total_steps,
                       processing_start, processing_end, total_duration_ms,
                       error_message, created_at, updated_at
                FROM workflow_executions
            """
            
            params = []
            if status:
                query += " WHERE status = $1"
                params.append(status)
            
            query += " ORDER BY created_at DESC LIMIT $" + str(len(params) + 1)
            params.append(limit)
            
            rows = await conn.fetch(query, *params)
            
            workflows = [
                {
                    "workflow_id": row["workflow_id"],
                    "query_id": str(row["query_id"]),
                    "status": row["status"],
                    "current_step": row["current_step"],
                    "total_steps": row["total_steps"],
                    "processing_start": row["processing_start"].isoformat() if row["processing_start"] else None,
                    "processing_end": row["processing_end"].isoformat() if row["processing_end"] else None,
                    "total_duration_ms": float(row["total_duration_ms"]) if row["total_duration_ms"] else None,
                    "error_message": row["error_message"],
                    "created_at": row["created_at"].isoformat(),
                    "updated_at": row["updated_at"].isoformat()
                }
                for row in rows
            ]
            
            return workflows
    
    async def delete_workflow(self, query_id: str) -> bool:
        """
        Delete workflow by query ID from PostgreSQL
        
        CASCADE will automatically delete workflow_steps
        
        Args:
            query_id: Query identifier
            
        Returns:
            True if deleted, False if not found
        """
        if not self.db_pool:
            raise RuntimeError("Database pool not initialized")
        
        async with self.db_pool.acquire() as conn:
            result = await conn.execute(
                "DELETE FROM workflow_executions WHERE query_id = $1",
                query_id
            )
            
            # Extract number of deleted rows from result string "DELETE N"
            deleted_count = int(result.split()[-1]) if result else 0
            
            if deleted_count > 0:
                logger.info(f"Deleted workflow for query {query_id}")
                return True
            
            return False
    
    # ========================================================================
    # Step Management
    # ========================================================================
    
    async def start_step(
        self,
        workflow_id: str,
        step_number: int,
        step_name: str
    ):
        """
        Mark a step as started in PostgreSQL
        
        Args:
            workflow_id: Workflow identifier
            step_number: Step number (1-6)
            step_name: Step name
        """
        if not self.db_pool:
            raise RuntimeError("Database pool not initialized")
        
        now = datetime.now()
        
        async with self.db_pool.acquire() as conn:
            # Update workflow status if this is the first step
            if step_number == 1:
                await conn.execute(
                    """
                    UPDATE workflow_executions
                    SET status = $1, processing_start = $2, updated_at = $3
                    WHERE workflow_id = $4
                    """,
                    "in_progress", now, now, workflow_id
                )
            
            # Update current_step
            await conn.execute(
                """
                UPDATE workflow_executions
                SET current_step = $1, updated_at = $2
                WHERE workflow_id = $3
                """,
                step_number, now, workflow_id
            )
            
            # Update step status
            await conn.execute(
                """
                UPDATE workflow_steps
                SET status = $1, start_time = $2, updated_at = $3
                WHERE workflow_id = $4 AND step_number = $5
                """,
                "in_progress", now, now, workflow_id, step_number
            )
        
        logger.info(f"Workflow {workflow_id}: Started step {step_number} - {step_name}")
    
    async def complete_step(
        self,
        workflow_id: str,
        step_number: int,
        result: Optional[Dict[str, Any]] = None
    ):
        """
        Mark a step as completed in PostgreSQL
        
        Args:
            workflow_id: Workflow identifier
            step_number: Step number (1-6)
            result: Step execution result
        """
        if not self.db_pool:
            raise RuntimeError("Database pool not initialized")
        
        now = datetime.now()
        
        async with self.db_pool.acquire() as conn:
            # Get start_time to calculate duration
            start_time_row = await conn.fetchrow(
                """
                SELECT start_time
                FROM workflow_steps
                WHERE workflow_id = $1 AND step_number = $2
                """,
                workflow_id, step_number
            )
            
            duration_ms = None
            if start_time_row and start_time_row["start_time"]:
                duration = (now - start_time_row["start_time"]).total_seconds() * 1000
                duration_ms = round(duration, 2)
            
            # Update step
            await conn.execute(
                """
                UPDATE workflow_steps
                SET status = $1, end_time = $2, duration_ms = $3, result = $4, updated_at = $5
                WHERE workflow_id = $6 AND step_number = $7
                """,
                "completed", now, duration_ms, result, now, workflow_id, step_number
            )
            
            # Update workflow updated_at
            await conn.execute(
                """
                UPDATE workflow_executions
                SET updated_at = $1
                WHERE workflow_id = $2
                """,
                now, workflow_id
            )
        
        logger.info(
            f"Workflow {workflow_id}: Completed step {step_number} ({duration_ms}ms)"
        )
    
    async def fail_step(
        self,
        workflow_id: str,
        step_number: int,
        error: str
    ):
        """
        Mark a step as failed in PostgreSQL
        
        Args:
            workflow_id: Workflow identifier
            step_number: Step number (1-6)
            error: Error message
        """
        if not self.db_pool:
            raise RuntimeError("Database pool not initialized")
        
        now = datetime.now()
        
        async with self.db_pool.acquire() as conn:
            # Get start_time to calculate duration
            start_time_row = await conn.fetchrow(
                """
                SELECT start_time
                FROM workflow_steps
                WHERE workflow_id = $1 AND step_number = $2
                """,
                workflow_id, step_number
            )
            
            duration_ms = None
            if start_time_row and start_time_row["start_time"]:
                duration = (now - start_time_row["start_time"]).total_seconds() * 1000
                duration_ms = round(duration, 2)
            
            # Update failed step
            await conn.execute(
                """
                UPDATE workflow_steps
                SET status = $1, end_time = $2, duration_ms = $3, error_message = $4, updated_at = $5
                WHERE workflow_id = $6 AND step_number = $7
                """,
                "failed", now, duration_ms, error, now, workflow_id, step_number
            )
            
            # Mark subsequent steps as skipped
            await conn.execute(
                """
                UPDATE workflow_steps
                SET status = $1, updated_at = $2
                WHERE workflow_id = $3 AND step_number > $4 AND status = $5
                """,
                "skipped", now, workflow_id, step_number, "pending"
            )
            
            # Update workflow updated_at
            await conn.execute(
                """
                UPDATE workflow_executions
                SET updated_at = $1
                WHERE workflow_id = $2
                """,
                now, workflow_id
            )
        
        logger.error(f"Workflow {workflow_id}: Step {step_number} failed - {error}")
    
    # ========================================================================
    # Workflow Completion
    # ========================================================================
    
    async def complete_workflow(
        self,
        workflow_id: str,
        final_result: Dict[str, Any]
    ):
        """
        Mark workflow as completed in PostgreSQL
        
        Args:
            workflow_id: Workflow identifier
            final_result: Final processing result
        """
        if not self.db_pool:
            raise RuntimeError("Database pool not initialized")
        
        now = datetime.now()
        
        async with self.db_pool.acquire() as conn:
            # Get processing_start to calculate total duration
            start_row = await conn.fetchrow(
                """
                SELECT processing_start
                FROM workflow_executions
                WHERE workflow_id = $1
                """,
                workflow_id
            )
            
            total_duration_ms = None
            if start_row and start_row["processing_start"]:
                duration = (now - start_row["processing_start"]).total_seconds() * 1000
                total_duration_ms = round(duration, 2)
            
            # Update workflow
            await conn.execute(
                """
                UPDATE workflow_executions
                SET status = $1, processing_end = $2, total_duration_ms = $3,
                    final_result = $4, updated_at = $5
                WHERE workflow_id = $6
                """,
                "completed", now, total_duration_ms, final_result, now, workflow_id
            )
        
        logger.info(f"Workflow {workflow_id} completed ({total_duration_ms}ms)")
    
    async def mark_workflow_failed(
        self,
        workflow_id: str,
        error: str
    ):
        """
        Mark workflow as failed in PostgreSQL
        
        Args:
            workflow_id: Workflow identifier
            error: Error message
        """
        if not self.db_pool:
            raise RuntimeError("Database pool not initialized")
        
        now = datetime.now()
        
        async with self.db_pool.acquire() as conn:
            # Get processing_start to calculate total duration
            start_row = await conn.fetchrow(
                """
                SELECT processing_start
                FROM workflow_executions
                WHERE workflow_id = $1
                """,
                workflow_id
            )
            
            total_duration_ms = None
            if start_row and start_row["processing_start"]:
                duration = (now - start_row["processing_start"]).total_seconds() * 1000
                total_duration_ms = round(duration, 2)
            
            # Update workflow
            await conn.execute(
                """
                UPDATE workflow_executions
                SET status = $1, processing_end = $2, total_duration_ms = $3,
                    error_message = $4, updated_at = $5
                WHERE workflow_id = $6
                """,
                "failed", now, total_duration_ms, error, now, workflow_id
            )
        
        logger.error(f"Workflow {workflow_id} failed: {error}")
    
    # ========================================================================
    # Statistics and Monitoring
    # ========================================================================
    
    async def get_statistics(self) -> Dict[str, Any]:
        """
        Get workflow statistics from PostgreSQL
        
        Returns:
            Statistics dictionary
        """
        if not self.db_pool:
            raise RuntimeError("Database pool not initialized")
        
        async with self.db_pool.acquire() as conn:
            # Total workflows
            total_count = await conn.fetchval(
                "SELECT COUNT(*) FROM workflow_executions"
            )
            
            # Count by status
            status_counts = await conn.fetch(
                """
                SELECT status, COUNT(*) as count
                FROM workflow_executions
                GROUP BY status
                """
            )
            
            # Average duration
            avg_duration = await conn.fetchval(
                """
                SELECT AVG(total_duration_ms)
                FROM workflow_executions
                WHERE status = 'completed' AND total_duration_ms IS NOT NULL
                """
            )
            
            # Average confidence (from final_result)
            avg_confidence = await conn.fetchval(
                """
                SELECT AVG((final_result->>'confidence_score')::decimal)
                FROM workflow_executions
                WHERE status = 'completed' AND final_result ? 'confidence_score'
                """
            )
        
        return {
            "total_workflows": total_count,
            "by_status": {row["status"]: row["count"] for row in status_counts},
            "avg_duration_ms": float(avg_duration) if avg_duration else 0,
            "avg_confidence_score": float(avg_confidence) if avg_confidence else 0
        }
    
    async def health_check(self) -> bool:
        """
        Check if workflow manager can access database
        
        Returns:
            True if healthy, False otherwise
        """
        try:
            if not self.db_pool:
                return False
            
            async with self.db_pool.acquire() as conn:
                await conn.fetchval("SELECT 1")
            
            return True
            
        except Exception as e:
            logger.error(f"Workflow manager health check failed: {str(e)}")
            return False
