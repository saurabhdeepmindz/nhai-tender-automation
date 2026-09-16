"""Verify ChromaDB Instance 4 ingestion"""
import chromadb

# Connect to ChromaDB
chroma_client = chromadb.PersistentClient(path="./query_db")
collection = chroma_client.get_or_create_collection(name="vendor_queries")

print("=" * 80)
print("CHROMADB INSTANCE 4 VERIFICATION")
print("=" * 80)
print(f"\nTotal items in vendor_queries collection: {collection.count()}")

if collection.count() > 0:
    # Get all items
    results = collection.get(
        where={"rfp_number": "SRA/IT/29369/2025"},
        limit=10
    )
    
    print(f"\n✅ Found {len(results['ids'])} Q&A pairs for RFP: SRA/IT/29369/2025")
    print("\nIngested Q&A Details:")
    print("-" * 80)
    
    for i, (qid, doc, meta) in enumerate(zip(results['ids'], results['documents'], results['metadatas']), 1):
        print(f"\n{i}. ID: {qid}")
        print(f"   Category: {meta['category']}")
        print(f"   Section: {meta['rfp_section']}")
        print(f"   Query: {meta['points_of_clarification'][:100]}...")
        print(f"   Response: {meta['response'][:100]}...")
    
    print("\n" + "=" * 80)
    print("✅ INGESTION SUCCESSFUL - ChromaDB Instance 4 ready for queries!")
    print("=" * 80)
else:
    print("\n⚠️  No data found. Ingestion may still be running or failed.")
