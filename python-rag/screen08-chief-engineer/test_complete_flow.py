"""
Test Complete Flow - Simulate Frontend Query Submission
Tests the entire flow from query submission to AI response with RAG retrieval
"""
import asyncio
import httpx
import json

# Configuration
SCREEN8_URL = "http://localhost:8001"
TEST_QUERY_ID = "test-query-001"

async def test_query_flow():
    """Test complete query flow"""
    print("=" * 80)
    print("TESTING COMPLETE FLOW - Frontend Query Submission")
    print("=" * 80)
    
    # Test query - similar to Financial category (EMD)
    test_data = {
        "query_id": TEST_QUERY_ID,
        "query_text": "Can startups or small businesses get exemption from earnest money deposit requirements?",
        "rfp_context": {
            "rfp_id": "SRA/IT/29369/2025",
            "rfp_title": "AI-Driven Tender Query Automation",
            "submission_deadline": "2026-03-15"
        },
        "min_confidence": 0.7
    }
    
    print("\n📤 Submitting Query to Screen 08...")
    print(f"   Query ID: {test_data['query_id']}")
    print(f"   Query Text: {test_data['query_text']}")
    print(f"   RFP Context: {test_data['rfp_context']['rfp_id']}")
    
    async with httpx.AsyncClient(timeout=120.0) as client:
        try:
            # Submit query to Screen 08
            print("\n⏳ Processing through 6-step workflow...")
            response = await client.post(
                f"{SCREEN8_URL}/api/chief-engineer/process-query",
                json=test_data
            )
            
            if response.status_code == 200:
                result = response.json()
                
                print("\n" + "=" * 80)
                print("✅ QUERY PROCESSED SUCCESSFULLY")
                print("=" * 80)
                
                response_data = result.get("response", {})
                
                # Display AI Response (should show similar queries from ChromaDB)
                print("\n📝 AI Response (from RAG):")
                print("-" * 80)
                ai_response = response_data.get("ai_response", "")
                print(ai_response)
                
                # Display Past Reference Response
                print("\n📌 Past Reference Response:")
                print("-" * 80)
                past_ref = response_data.get("past_ref_response", "")
                print(past_ref if past_ref else "(No reference found)")
                
                # Display Past Response
                print("\n📋 Past Response:")
                print("-" * 80)
                past_resp = response_data.get("past_response", "")
                print(past_resp if past_resp else "(No past response found)")
                
                # Display Confidence Score
                print("\n📊 Confidence Score:")
                print("-" * 80)
                confidence = response_data.get("confidence", 0.0)
                print(f"{confidence:.2%}")
                
                # Display Source Documents
                print("\n📚 Source Documents:")
                print("-" * 80)
                sources = response_data.get("source_documents", [])
                if sources:
                    for idx, source in enumerate(sources[:3], 1):
                        print(f"{idx}. {source}")
                else:
                    print("(No source documents)")
                
                # Display Workflow Steps
                print("\n⚙️ Workflow Steps Executed:")
                print("-" * 80)
                steps = response_data.get("workflow_steps", [])
                if steps:
                    for step in steps:
                        step_num = step.get("step_number", "?")
                        step_name = step.get("step_name", "Unknown")
                        status = step.get("status", "unknown")
                        emoji = "✅" if status == "completed" else "❌"
                        print(f"{emoji} Step {step_num}: {step_name}")
                else:
                    print("(No workflow steps recorded)")
                
                # Display Processing Time
                print("\n⏱️ Processing Time:")
                print("-" * 80)
                proc_time = response_data.get("processing_time", 0.0)
                print(f"{proc_time:.2f} seconds")
                
                print("\n" + "=" * 80)
                print("✅ TEST COMPLETED SUCCESSFULLY")
                print("=" * 80)
                
                # Verification
                print("\n🔍 RAG Verification:")
                print("-" * 80)
                if past_ref and "SRA/IT/29369/2025" in past_ref:
                    print("✅ past_ref_response contains RFP number from ChromaDB")
                else:
                    print("⚠️  past_ref_response missing or incomplete")
                
                if past_resp:
                    print("✅ past_response retrieved from ChromaDB")
                else:
                    print("⚠️  past_response not found")
                
                if ai_response:
                    print("✅ ai_response generated")
                else:
                    print("⚠️  ai_response is empty")
                
                return result
                
            else:
                print(f"\n❌ Error: {response.status_code}")
                print(response.text)
                return None
                
        except Exception as e:
            print(f"\n❌ Request failed: {str(e)}")
            return None

# Run the test
if __name__ == "__main__":
    print("\n🚀 Starting complete flow test...")
    print("   Make sure Screen 08 is running on port 8001")
    print("   Make sure ChromaDB Instance 4 has data (7 Q&A pairs)")
    print("\n")
    
    result = asyncio.run(test_query_flow())
    
    if result:
        print("\n✅ You can now test from the frontend UI:")
        print("   1. Go to http://localhost:3002/prebid-query")
        print("   2. Submit a query similar to pre-bid Q&A")
        print("   3. Check if ai_response shows similar queries AS IS")
        print("   4. Verify past_response shows official SRA response")
