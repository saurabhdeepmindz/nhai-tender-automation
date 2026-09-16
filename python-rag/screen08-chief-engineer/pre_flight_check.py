"""
Pre-Flight Check - Verify everything is ready before submitting new query
"""
import asyncio
import asyncpg
import httpx
import chromadb

async def pre_flight_check():
    print("=" * 80)
    print("PRE-FLIGHT CHECK - Screen 08 & ChromaDB Instance 4")
    print("=" * 80)
    
    all_ready = True
    
    # Check 1: Screen 08 Health
    print("\n[1] Checking Screen 08 (main.py) on port 8001...")
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get("http://localhost:8001/api/health")
            if response.status_code == 200:
                data = response.json()
                print(f"   ✅ Screen 08 is running")
                print(f"      Status: {data.get('status')}")
                print(f"      Port: {data.get('port', 8001)}")
            else:
                print(f"   ❌ Screen 08 returned status code: {response.status_code}")
                all_ready = False
    except Exception as e:
        print(f"   ❌ Screen 08 NOT running: {str(e)}")
        print(f"      → Run: python main.py")
        all_ready = False
    
    # Check 2: ChromaDB Instance 4
    print("\n[2] Checking ChromaDB Instance 4 (query_db)...")
    try:
        chroma_client = chromadb.PersistentClient(path="./query_db")
        collection = chroma_client.get_or_create_collection(name="vendor_queries")
        count = collection.count()
        
        if count >= 7:
            print(f"   ✅ ChromaDB Instance 4 has {count} items")
            
            # Get sample Q&A
            sample = collection.get(limit=1, include=["metadatas", "documents"])
            if sample and sample['metadatas']:
                meta = sample['metadatas'][0]
                print(f"      Sample: RFP {meta.get('rfp_number')} - Category: {meta.get('category')}")
        else:
            print(f"   ⚠️  ChromaDB Instance 4 has only {count} items (expected 7)")
            print(f"      → Run: python ingest_prebid_qa.py")
            all_ready = False
    except Exception as e:
        print(f"   ❌ ChromaDB check failed: {str(e)}")
        all_ready = False
    
    # Check 3: PostgreSQL Database
    print("\n[3] Checking PostgreSQL database...")
    try:
        conn = await asyncpg.connect(
            host="localhost",
            port=5432,
            database="nhai_tender_db",
            user="postgres",
            password="your_password"
        )
        
        # Check queries table exists
        query = "SELECT COUNT(*) FROM queries"
        count = await conn.fetchval(query)
        print(f"   ✅ PostgreSQL connected")
        print(f"      Total queries in database: {count}")
        
        await conn.close()
    except Exception as e:
        print(f"   ❌ PostgreSQL check failed: {str(e)}")
        all_ready = False
    
    # Check 4: Backend Service
    print("\n[4] Checking NestJS Backend on port 3001...")
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get("http://localhost:3001/health")
            if response.status_code == 200:
                print(f"   ✅ NestJS Backend is running")
            else:
                print(f"   ⚠️  Backend returned status: {response.status_code}")
    except Exception as e:
        print(f"   ❌ Backend check failed: {str(e)}")
        print(f"      → Backend may not be running, but queries can still be tested directly")
    
    # Check 5: Frontend
    print("\n[5] Checking Next.js Frontend on port 3002...")
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get("http://localhost:3002")
            if response.status_code == 200:
                print(f"   ✅ Frontend is running")
                print(f"      → Open: http://localhost:3002/prebid-query")
            else:
                print(f"   ⚠️  Frontend returned status: {response.status_code}")
    except Exception as e:
        print(f"   ⚠️  Frontend check failed: {str(e)}")
        print(f"      → Frontend may not be running")
    
    # Final Summary
    print("\n" + "=" * 80)
    print("SUMMARY")
    print("=" * 80)
    
    if all_ready:
        print("\n✅ ALL SYSTEMS READY!")
        print("\n📝 Next Steps:")
        print("   1. Go to: http://localhost:3002/prebid-query")
        print("   2. Submit a test query similar to pre-bid Q&A, for example:")
        print("      • 'Can MSME companies get EMD exemption?'")
        print("      • 'Is international consortium experience acceptable?'")
        print("      • 'Will SRA help with WhatsApp API integration?'")
        print("   3. Wait for processing to complete")
        print("   4. Check if ai_response, past_ref_response, past_response are populated")
        print("\n📊 After submission, run:")
        print("   python check_table_structure.py")
        print("   (Update query_id to the new one from UI)")
    else:
        print("\n⚠️  SOME ISSUES DETECTED")
        print("\nPlease fix the issues above before submitting a new query.")
    
    print("\n" + "=" * 80)

if __name__ == "__main__":
    asyncio.run(pre_flight_check())
