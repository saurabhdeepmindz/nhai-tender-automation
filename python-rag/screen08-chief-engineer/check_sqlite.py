import sqlite3
import json

# Connect to ChromaDB SQLite database
db_path = '../../query_db/chroma.sqlite3'
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Check tables
print("=== Tables in ChromaDB ===")
cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = cursor.fetchall()
for table in tables:
    print(f"  - {table[0]}")

# Check collections
print("\n=== Collections ===")
try:
    cursor.execute("SELECT id, name FROM collections LIMIT 10")
    collections = cursor.fetchall()
    for col_id, col_name in collections:
        print(f"  - {col_name} (ID: {col_id})")
except Exception as e:
    print(f"Error: {e}")
    cursor.execute("PRAGMA table_info(collections)")
    cols = cursor.fetchall()
    print("Available columns in collections table:")
    for col in cols:
        print(f"  - {col[1]}")

# Try to get vendor_queries data
print("\n=== Checking for vendor_queries collection ===")
try:
    cursor.execute("SELECT id FROM collections WHERE name='vendor_queries'")
    result = cursor.fetchone()
    if result:
        collection_id = result[0]
        print(f"Collection ID: {collection_id}")
        
        # First check embeddings table structure
        cursor.execute("PRAGMA table_info(embeddings)")
        cols = cursor.fetchall()
        print("Embeddings table columns:")
        for col in cols:
            print(f"  - {col[1]}")
        
        # Get segment_id for this collection
        cursor.execute("SELECT id FROM segments WHERE collection=?", (collection_id,))
        segment_result = cursor.fetchone()
        if segment_result:
            segment_id = segment_result[0]
            print(f"Segment ID: {segment_id}")
            
            # Get embeddings count
            cursor.execute("SELECT COUNT(*) FROM embeddings WHERE segment_id=?", (segment_id,))
            count = cursor.fetchone()[0]
            print(f"Total items in vendor_queries: {count}")
        
            if count > 0:
                # Get sample with metadata
                cursor.execute("""
                    SELECT e.id, e.document, e.metadata
                    FROM embeddings e
                    WHERE e.segment_id=?
                    LIMIT 5
                """, (segment_id,))
            
                items = cursor.fetchall()
                print(f"\n=== Sample Items (showing {len(items)}) ===")
                for i, (item_id, document, metadata_str) in enumerate(items, 1):
                    print(f"\n{i}. ID: {item_id}")
                    print(f"   Document: {document[:200] if document else 'N/A'}...")
                    if metadata_str:
                        try:
                            metadata = json.loads(metadata_str)
                            print(f"   RFP Number: {metadata.get('rfp_number', 'N/A')}")
                            print(f"   Response: {metadata.get('response', 'EMPTY')[:100]}...")
                        except:
                            print(f"   Metadata: {metadata_str[:100]}...")
                
                # Check for SRA/IT/29369/2025
                print("\n=== Searching for RFP SRA/IT/29369/2025 ===")
                cursor.execute("""
                    SELECT e.id, e.document, e.metadata
                    FROM embeddings e
                    WHERE e.segment_id=?
                    AND e.metadata LIKE '%SRA/IT/29369/2025%'
                    LIMIT 10
                """, (segment_id,))
                
                sra_items = cursor.fetchall()
                print(f"Found {len(sra_items)} items with RFP SRA/IT/29369/2025")
                
                if sra_items:
                    for i, (item_id, document, metadata_str) in enumerate(sra_items, 1):
                        print(f"\n{i}. ID: {item_id}")
                        print(f"   Query: {document[:300] if document else 'N/A'}")
                        if metadata_str:
                            try:
                                metadata = json.loads(metadata_str)
                                response = metadata.get('response', '')
                                if response:
                                    print(f"   Response: {response[:300]}...")
                                else:
                                    print(f"   Response: EMPTY")
                            except:
                                print(f"   Metadata: {metadata_str[:100]}...")
        else:
            print("No segment found for collection")
    else:
        print("vendor_queries collection not found")
except Exception as e:
    print(f"Error: {e}")

conn.close()
