"""Check queries table structure"""
import asyncpg
import asyncio

async def check_table_structure():
    conn = await asyncpg.connect(
        host="localhost",
        port=5432,
        database="nhai_tender_db",
        user="postgres",
        password="your_password"
    )
    
    try:
        # Get table columns
        query = """
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'queries'
        ORDER BY ordinal_position
        """
        
        columns = await conn.fetch(query)
        
        print("=" * 80)
        print("QUERIES TABLE STRUCTURE")
        print("=" * 80)
        
        if columns:
            print("\nColumns found:")
            for col in columns:
                print(f"   {col['column_name']:<30} {col['data_type']}")
        else:
            print("\n⚠️  Table 'queries' not found or no columns")
        
        # Try to find the query by UUID
        print("\n" + "=" * 80)
        print("SEARCHING FOR QUERY BY UUID")
        print("=" * 80)
        
        query_id = "b3c24807-7cf7-4ef2-a5b4-c15d163fe828"
        
        # Get all columns dynamically
        search_query = "SELECT * FROM queries WHERE query_id = $1 LIMIT 1"
        
        try:
            result = await conn.fetchrow(search_query, query_id)
            
            if result:
                print(f"\n✅ Query found!")
                print("-" * 80)
                for key, value in dict(result).items():
                    if isinstance(value, str) and len(value) > 100:
                        print(f"   {key}: {value[:100]}...")
                    else:
                        print(f"   {key}: {value}")
            else:
                print(f"\n❌ Query not found with ID: {query_id}")
        except Exception as e:
            print(f"\n❌ Error searching: {str(e)}")
        
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(check_table_structure())
