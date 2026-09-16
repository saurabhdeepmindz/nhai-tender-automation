"""
Screen 8: Workflow Manager
NHAI AI-Driven Tender Query Automation System

Manages the 6-step agentic workflow execution:
- Workflow creation and tracking
- Step status monitoring
- Performance metrics
- Real-time status updates for frontend visualization

Author: NHAI Development Team
Version: 1.0.0
"""

import logging
from typing import Dict, List, Any, Optional
from datetime import datetime
import uuid
import asyncio

logger = logging.getLogger(__name__)

class WorkflowManager:
    """
    Manages workflows for Chief Engineer Agent
    
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
        """Initialize Workflow Manager"""
        # In-memory storage (would be PostgreSQL in production)
        self.workflows = {}
        self.metrics = {
            "total_queries": 0,
            "successful_queries": 0,
            "failed_queries": 0,
            "total_processing_time_ms": 0,
            "total_confidence_score": 0.0
        }
        
        logger.info("Workflow Manager initialized")
    
    # ========================================================================
    # Workflow Creation and Management
    # ========================================================================
    
    async def create_workflow(self, query_id: str) -> Dict[str, Any]:
        """
        Create a new workflow for a query
        
        Args:
            query_id: Unique query identifier
            
        Returns:
            Workflow object with tracking information
        """
        workflow_id = str(uuid.uuid4())
        
        workflow = {
            "workflow_id": workflow_id,
            "query_id": query_id,
            "status": "pending",
            "current_step": 0,
            "total_steps": 6,
            "steps": [
                {
                    "step_number": step["step_number"],
                    "step_name": step["step_name"],
                    "status": "pending",
                    "start_time": None,
                    "end_time": None,
                    "duration_ms": None,
                    "result": None,
                    "error": None
                }
                for step in self.WORKFLOW_STEPS
            ],
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat(),
            "processing_start": None,
            "processing_end": None,
            "total_duration_ms": None
        }
        
        self.workflows[workflow_id] = workflow
        logger.info(f"Created workflow {workflow_id} for query {query_id}")
        
        return workflow
    
    async def get_workflow(self, workflow_id: str) -> Optional[Dict[str, Any]]:
        """Get workflow by ID"""
        return self.workflows.get(workflow_id)
    
    async def get_workflow_by_query(self, query_id: str) -> Optional[Dict[str, Any]]:
        """Get workflow by query ID"""
        for workflow in self.workflows.values():
            if workflow["query_id"] == query_id:
                return workflow
        return None
    
    async def list_workflows(
        self,
        status: Optional[str] = None,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """
        List workflows with optional filtering
        
        Args:
            status: Filter by status (pending, in_progress, completed, failed)
            limit: Maximum number to return
        """
        workflows = list(self.workflows.values())
        
        if status:
            workflows = [w for w in workflows if w["status"] == status]
        
        # Sort by created_at (newest first)
        workflows.sort(key=lambda w: w["created_at"], reverse=True)
        
        return workflows[:limit]
    
    async def delete_workflow(self, query_id: str) -> bool:
        """Delete workflow by query ID"""
        for workflow_id, workflow in list(self.workflows.items()):
            if workflow["query_id"] == query_id:
                del self.workflows[workflow_id]
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
        Mark a step as started
        
        Args:
            workflow_id: Workflow identifier
            step_number: Step number (1-6)
            step_name: Step name
        """
        workflow = self.workflows.get(workflow_id)
        if not workflow:
            logger.warning(f"Workflow {workflow_id} not found")
            return
        
        # Update workflow status if this is the first step
        if step_number == 1:
            workflow["status"] = "in_progress"
            workflow["processing_start"] = datetime.now().isoformat()
        
        # Update step
        step = workflow["steps"][step_number - 1]
        step["status"] = "in_progress"
        step["start_time"] = datetime.now().isoformat()
        
        # Update current step
        workflow["current_step"] = step_number
        workflow["updated_at"] = datetime.now().isoformat()
        
        logger.info(f"Workflow {workflow_id}: Started step {step_number} - {step_name}")
    
    async def complete_step(
        self,
        workflow_id: str,
        step_number: int,
        result: Optional[Dict[str, Any]] = None
    ):
        """
        Mark a step as completed
        
        Args:
            workflow_id: Workflow identifier
            step_number: Step number (1-6)
            result: Step execution result
        """
        workflow = self.workflows.get(workflow_id)
        if not workflow:
            logger.warning(f"Workflow {workflow_id} not found")
            return
        
        # Update step
        step = workflow["steps"][step_number - 1]
        step["status"] = "completed"
        step["end_time"] = datetime.now().isoformat()
        step["result"] = result
        
        # Calculate duration
        if step["start_time"]:
            start = datetime.fromisoformat(step["start_time"])
            end = datetime.fromisoformat(step["end_time"])
            duration = (end - start).total_seconds() * 1000
            step["duration_ms"] = round(duration, 2)
        
        workflow["updated_at"] = datetime.now().isoformat()
        
        logger.info(
            f"Workflow {workflow_id}: Completed step {step_number} "
            f"({step.get('duration_ms', 0)}ms)"
        )
    
    async def fail_step(
        self,
        workflow_id: str,
        step_number: int,
        error: str
    ):
        """
        Mark a step as failed
        
        Args:
            workflow_id: Workflow identifier
            step_number: Step number (1-6)
            error: Error message
        """
        workflow = self.workflows.get(workflow_id)
        if not workflow:
            logger.warning(f"Workflow {workflow_id} not found")
            return
        
        # Update step
        step = workflow["steps"][step_number - 1]
        step["status"] = "failed"
        step["end_time"] = datetime.now().isoformat()
        step["error"] = error
        
        # Calculate duration if started
        if step["start_time"]:
            start = datetime.fromisoformat(step["start_time"])
            end = datetime.fromisoformat(step["end_time"])
            duration = (end - start).total_seconds() * 1000
            step["duration_ms"] = round(duration, 2)
        
        # Mark subsequent steps as skipped
        for i in range(step_number, 6):
            workflow["steps"][i]["status"] = "skipped"
        
        workflow["updated_at"] = datetime.now().isoformat()
        
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
        Mark workflow as completed
        
        Args:
            workflow_id: Workflow identifier
            final_result: Final processing result
        """
        workflow = self.workflows.get(workflow_id)
        if not workflow:
            logger.warning(f"Workflow {workflow_id} not found")
            return
        
        workflow["status"] = "completed"
        workflow["processing_end"] = datetime.now().isoformat()
        
        # Calculate total duration
        if workflow["processing_start"]:
            start = datetime.fromisoformat(workflow["processing_start"])
            end = datetime.fromisoformat(workflow["processing_end"])
            duration = (end - start).total_seconds() * 1000
            workflow["total_duration_ms"] = round(duration, 2)
        
        workflow["final_result"] = final_result
        workflow["updated_at"] = datetime.now().isoformat()
        
        # Update metrics
        self.metrics["total_queries"] += 1
        self.metrics["successful_queries"] += 1
        self.metrics["total_processing_time_ms"] += workflow.get("total_duration_ms", 0)
        self.metrics["total_confidence_score"] += final_result.get("confidence_score", 0.0)
        
        logger.info(
            f"Workflow {workflow_id} completed successfully "
            f"({workflow.get('total_duration_ms', 0)}ms)"
        )
    
    async def mark_workflow_failed(
        self,
        workflow_id: str,
        error: str
    ):
        """
        Mark workflow as failed
        
        Args:
            workflow_id: Workflow identifier
            error: Error message
        """
        workflow = self.workflows.get(workflow_id)
        if not workflow:
            logger.warning(f"Workflow {workflow_id} not found")
            return
        
        workflow["status"] = "failed"
        workflow["processing_end"] = datetime.now().isoformat()
        workflow["error"] = error
        
        # Calculate total duration if started
        if workflow["processing_start"]:
            start = datetime.fromisoformat(workflow["processing_start"])
            end = datetime.fromisoformat(workflow["processing_end"])
            duration = (end - start).total_seconds() * 1000
            workflow["total_duration_ms"] = round(duration, 2)
        
        workflow["updated_at"] = datetime.now().isoformat()
        
        # Update metrics
        self.metrics["total_queries"] += 1
        self.metrics["failed_queries"] += 1
        
        logger.error(f"Workflow {workflow_id} failed - {error}")
    
    # ========================================================================
    # Statistics
    # ========================================================================
    
    async def get_statistics(self) -> Dict[str, Any]:
        """
        Get workflow statistics
        
        Returns performance metrics for monitoring
        """
        total = self.metrics["total_queries"]
        successful = self.metrics["successful_queries"]
        
        return {
            "total_queries": total,
            "successful_queries": successful,
            "failed_queries": self.metrics["failed_queries"],
            "success_rate": round(successful / total, 2) if total > 0 else 0.0,
            "avg_processing_time": round(
                self.metrics["total_processing_time_ms"] / total, 2
            ) if total > 0 else 0.0,
            "avg_confidence": round(
                self.metrics["total_confidence_score"] / successful, 2
            ) if successful > 0 else 0.0,
            "active_workflows": len([
                w for w in self.workflows.values()
                if w["status"] in ["pending", "in_progress"]
            ])
        }
    
    async def get_step_statistics(self) -> Dict[str, Any]:
        """Get statistics for each step"""
        step_stats = {}
        
        for step_def in self.WORKFLOW_STEPS:
            step_num = step_def["step_number"]
            step_name = step_def["step_name"]
            
            # Collect data for this step
            durations = []
            failures = 0
            
            for workflow in self.workflows.values():
                if workflow["status"] in ["completed", "failed"]:
                    step = workflow["steps"][step_num - 1]
                    
                    if step["duration_ms"]:
                        durations.append(step["duration_ms"])
                    
                    if step["status"] == "failed":
                        failures += 1
            
            step_stats[step_name] = {
                "average_duration_ms": round(sum(durations) / len(durations), 2) if durations else 0,
                "min_duration_ms": min(durations) if durations else 0,
                "max_duration_ms": max(durations) if durations else 0,
                "failure_count": failures
            }
        
        return step_stats
    
    async def reset_metrics(self):
        """Reset all metrics (for testing)"""
        self.metrics = {
            "total_queries": 0,
            "successful_queries": 0,
            "failed_queries": 0,
            "total_processing_time_ms": 0,
            "total_confidence_score": 0.0
        }
        logger.info("Metrics reset")
    
    def __repr__(self) -> str:
        """String representation"""
        return (
            f"WorkflowManager("
            f"workflows={len(self.workflows)}, "
            f"processed={self.metrics['total_queries']}"
            f")"
        )
