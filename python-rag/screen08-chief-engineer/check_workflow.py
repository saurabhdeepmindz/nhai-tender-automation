"""Check workflow execution details"""
import asyncpg
import asyncio

async def check_workflow():
    query_id = "b3c24807-7cf7-4ef2-a5b4-c15d163fe828"
    
    conn = await asyncpg.connect(
        host="localhost",
        port=5432,
        database="nhai_tender_db",
        user="postgres",
        password="your_password"
    )
    
    try:
        print("=" * 80)
        print(f"WORKFLOW EXECUTION DETAILS: {query_id}")
        print("=" * 80)
        
        # Check workflow_executions
        workflow_query = """
        SELECT 
            id,
            query_id,
            status,
            total_steps,
            current_step,
            error_message,
            started_at,
            completed_at,
            result
        FROM workflow_executions
        WHERE query_id = $1
        ORDER BY started_at DESC
        """
        
        workflows = await conn.fetch(workflow_query, query_id)
        
        if workflows:
            print(f"\n✅ Found {len(workflows)} workflow execution(s):\n")
            for idx, wf in enumerate(workflows, 1):
                print(f"Workflow #{idx}:")
                print(f"   ID: {wf['id']}")
                print(f"   Status: {wf['status']}")
                print(f"   Steps: {wf['current_step']}/{wf['total_steps']}")
                print(f"   Started: {wf['started_at']}")
                print(f"   Completed: {wf['completed_at']}")
                print(f"   Error: {wf['error_message'] if wf['error_message'] else '(None)'}")
                if wf['result']:
                    print(f"   Result: {str(wf['result'])[:200]}...")
                
                # Get workflow steps
                steps_query = """
                SELECT 
                    step_number,
                    step_name,
                    status,
                    error_message,
                    started_at,
                    completed_at,
                    result
                FROM workflow_steps
                WHERE workflow_id = $1
                ORDER BY step_number
                """
                
                steps = await conn.fetch(steps_query, wf['id'])
                
                if steps:
                    print(f"\n   Workflow Steps:")
                    for step in steps:
                        status_emoji = "✅" if step['status'] == 'completed' else "❌" if step['status'] == 'failed' else "⏳"
                        print(f"      {status_emoji} Step {step['step_number']}: {step['step_name']}")
                        print(f"         Status: {step['status']}")
                        if step['error_message']:
                            print(f"         Error: {step['error_message']}")
                        if step['result']:
                            print(f"         Result: {str(step['result'])[:150]}...")
                        print(f"         Duration: {step['started_at']} → {step['completed_at']}")
                print("\n" + "-" * 80 + "\n")
        else:
            print(f"\n⚠️  NO workflow executions found!")
            print("   This means Screen 08 never received the query.")
            print("\n   Possible causes:")
            print("   1. Backend didn't call Screen 08 API")
            print("   2. Screen 08 service is down")
            print("   3. Network/connection issue between backend and Screen 08")
            print("   4. Backend error before calling Screen 08")
        
        print("=" * 80)
        print("DIAGNOSIS:")
        print("=" * 80)
        
        if not workflows:
            print("\n❌ Query was saved to database but NEVER sent to Screen 08")
            print("   → Check NestJS backend logs for errors")
            print("   → Verify Screen 08 is running on http://localhost:8001")
            print("   → Check backend integration code for Screen 08 calls")
        elif workflows[0]['status'] == 'failed':
            print(f"\n❌ Workflow FAILED at step {workflows[0]['current_step']}/{workflows[0]['total_steps']}")
            print(f"   Error: {workflows[0]['error_message']}")
            print("   → Check Screen 08 logs for detailed error")
        elif workflows[0]['status'] == 'running':
            print(f"\n⏳ Workflow is still RUNNING (stuck at step {workflows[0]['current_step']})")
            print("   → May be hung, check Screen 08 for issues")
        
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(check_workflow())
