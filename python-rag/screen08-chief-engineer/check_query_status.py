"""Check query status in PostgreSQL database"""
import asyncpg
import asyncio
import json

async def check_query_status():
    query_id = "b3c24807-7cf7-4ef2-a5b4-c15d163fe828"
    
    print("=" * 80)
    print(f"CHECKING QUERY STATUS: {query_id}")
    print("=" * 80)
    
    # Connect to PostgreSQL
    conn = await asyncpg.connect(
        host="localhost",
        port=5432,
        database="nhai_tender_db",
        user="postgres",
        password="your_password"
    )
    
    try:
        # Check queries table
        print("\n[1] Checking queries table...")
        query = """
        SELECT 
            id,
            vendor_id,
            rfp_id,
            query_text,
            ai_response,
            past_ref_response,
            past_response,
            "ai-processed",
            confidence_score,
            workflow_status,
            created_at,
            updated_at
        FROM queries
        WHERE id = $1
        """
        
        result = await conn.fetchrow(query, query_id)
        
        if result:
            print("\n✅ Query found in database:")
            print("-" * 80)
            print(f"   ID: {result['id']}")
            print(f"   Vendor ID: {result['vendor_id']}")
            print(f"   RFP ID: {result['rfp_id']}")
            print(f"   Query Text: {result['query_text'][:100]}...")
            print(f"\n   AI Response: {result['ai_response'] if result['ai_response'] else '(NULL)'}")
            print(f"   Past Ref Response: {result['past_ref_response'] if result['past_ref_response'] else '(NULL)'}")
            print(f"   Past Response: {result['past_response'] if result['past_response'] else '(NULL)'}")
            print(f"\n   AI Processed: {result['ai-processed']}")
            print(f"   Confidence Score: {result['confidence_score']}")
            print(f"   Workflow Status: {result['workflow_status']}")
            print(f"\n   Created At: {result['created_at']}")
            print(f"   Updated At: {result['updated_at']}")
            
            # Check workflow_executions table
            print("\n[2] Checking workflow_executions table...")
            workflow_query = """
            SELECT 
                id,
                query_id,
                status,
                total_steps,
                current_step,
                error_message,
                started_at,
                completed_at
            FROM workflow_executions
            WHERE query_id = $1
            ORDER BY started_at DESC
            LIMIT 5
            """
            
            workflows = await conn.fetch(workflow_query, query_id)
            
            if workflows:
                print(f"\n✅ Found {len(workflows)} workflow execution(s):")
                print("-" * 80)
                for idx, wf in enumerate(workflows, 1):
                    print(f"\n   Workflow #{idx}:")
                    print(f"      ID: {wf['id']}")
                    print(f"      Status: {wf['status']}")
                    print(f"      Steps: {wf['current_step']}/{wf['total_steps']}")
                    print(f"      Error: {wf['error_message'] if wf['error_message'] else '(None)'}")
                    print(f"      Started: {wf['started_at']}")
                    print(f"      Completed: {wf['completed_at']}")
                    
                    # Check workflow steps
                    steps_query = """
                    SELECT 
                        step_number,
                        step_name,
                        status,
                        error_message,
                        started_at,
                        completed_at
                    FROM workflow_steps
                    WHERE workflow_id = $1
                    ORDER BY step_number
                    """
                    
                    steps = await conn.fetch(steps_query, wf['id'])
                    if steps:
                        print(f"      Steps executed:")
                        for step in steps:
                            status_emoji = "✅" if step['status'] == 'completed' else "❌" if step['status'] == 'failed' else "⏳"
                            print(f"         {status_emoji} Step {step['step_number']}: {step['step_name']} - {step['status']}")
                            if step['error_message']:
                                print(f"            Error: {step['error_message']}")
            else:
                print("\n⚠️  No workflow executions found for this query")
                print("   → Screen 08 may not have received the query")
            
            print("\n" + "=" * 80)
            print("DIAGNOSIS:")
            print("=" * 80)
            
            if not result['ai-processed']:
                print("❌ ai-processed = false")
                if not workflows:
                    print("   → Query was NOT sent to Screen 08")
                    print("   → Check NestJS backend logs")
                    print("   → Verify Screen 08 integration in backend")
                elif workflows and workflows[0]['status'] == 'failed':
                    print("   → Workflow execution FAILED")
                    print("   → Check error message above")
                    print("   → Check Screen 08 logs")
                elif workflows and workflows[0]['status'] == 'running':
                    print("   → Workflow is still RUNNING")
                    print("   → Wait for completion or check for hangs")
                else:
                    print("   → Workflow completed but response not saved")
                    print("   → Check response update logic in backend")
            
            if not result['ai_response']:
                print("❌ ai_response is NULL")
                print("   → RAG retrieval may have failed")
                print("   → Check ChromaDB Instance 4 connection")
            
            if not result['past_ref_response']:
                print("❌ past_ref_response is NULL")
                print("   → No similar queries found in ChromaDB")
            
            if not result['past_response']:
                print("❌ past_response is NULL")
                print("   → No historical response retrieved")
            
        else:
            print(f"\n❌ Query ID not found in database: {query_id}")
        
    finally:
        await conn.close()

# Run the check
if __name__ == "__main__":
    asyncio.run(check_query_status())
