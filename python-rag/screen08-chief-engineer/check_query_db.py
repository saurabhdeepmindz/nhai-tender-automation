import chromadb

# Check ChromaDB Instance 4 - query_db
client = chromadb.PersistentClient(path='../../query_db')

print("Available collections:")
try:
    collections = client.list_collections()
    for col in collections:
        print(f"  - {col.name} ({col.count()} items)")
except Exception as e:
    print(f"Error listing collections: {e}")

collection = client.get_or_create_collection('vendor_queries')

print(f'Total queries in Instance 4: {collection.count()}')

# Check for queries with RFP number SRA/IT/29369/2025
results = collection.get(
    where={'rfp_number': 'SRA/IT/29369/2025'}, 
    limit=10
)

print(f'\nQueries with RFP SRA/IT/29369/2025: {len(results["ids"])}')

if results['ids']:
    print(f'\n=== Queries Found ===')
    for i, (qid, doc, meta) in enumerate(zip(results["ids"], results["documents"], results["metadatas"]), 1):
        print(f'\n{i}. Query ID: {qid}')
        print(f'   Query Text: {doc[:200]}')
        response_text = meta.get("response", "")
        if response_text:
            print(f'   Response: {response_text[:200]}')
        else:
            print(f'   Response: EMPTY')
        print(f'   Category: {meta.get("category", "N/A")}')
else:
    print('\n❌ No queries found with RFP number SRA/IT/29369/2025')
    print('\nChecking all unique RFP numbers in database...')
    all_results = collection.get(limit=100)
    rfp_numbers = set()
    for meta in all_results['metadatas']:
        if 'rfp_number' in meta:
            rfp_numbers.add(meta['rfp_number'])
    print(f'Total queries: {len(all_results["ids"])}')
    print(f'Unique RFP numbers found ({len(rfp_numbers)}):')
    for rfp in sorted(rfp_numbers):
        print(f'  - {rfp}')
