"""
Check ChromaDB Contents - Diagnose why similarity is 0.0
"""
import chromadb
import os

query_db_path = "./query_db"

print("\n" + "="*100)
print("CHROMADB CONTENTS DIAGNOSIS")
print("="*100)

client = chromadb.PersistentClient(path=query_db_path)
collection = client.get_collection(name="vendor_queries")

# Get ALL items
results = collection.get(
    include=["documents", "metadatas", "embeddings"]
)

total = len(results['ids'])
print(f"\n📊 Total items in collection: {total}")

# Group by ID prefix
old_format = []
new_format = []
current_queries = []

for idx, (item_id, metadata, embedding) in enumerate(zip(results['ids'], results['metadatas'], results['embeddings']), 1):
    has_embedding = embedding is not None and len(embedding) > 0
    embedding_info = f"{len(embedding)} dims" if has_embedding else "❌ MISSING"
    
    if item_id.startswith("q_"):
        old_format.append((item_id, metadata, embedding_info))
    elif item_id.startswith("qa_"):
        new_format.append((item_id, metadata, embedding_info))
    else:
        current_queries.append((item_id, metadata, embedding_info))

print("\n" + "-"*100)
print(f"📦 OLD FORMAT (q_*): {len(old_format)} items")
print("-"*100)
for item_id, metadata, emb_info in old_format[:10]:  # Show first 10
    query_text = metadata.get('query', 'N/A')[:60]
    rfp = metadata.get('rfp_number', 'N/A')
    category = metadata.get('category', 'N/A')
    response = metadata.get('response', '')
    response_len = len(response) if response else 0
    print(f"  ID: {item_id}")
    print(f"    Query: {query_text}...")
    print(f"    RFP: {rfp}, Category: {category}")
    print(f"    Embedding: {emb_info}")
    print(f"    Response: {response_len} chars")
    print()

print("\n" + "-"*100)
print(f"📦 NEW FORMAT (qa_*): {len(new_format)} items")
print("-"*100)
for item_id, metadata, emb_info in new_format[:10]:  # Show first 10
    query_text = metadata.get('query', metadata.get('points_of_clarification', 'N/A'))[:60]
    rfp = metadata.get('rfp_number', 'N/A')
    category = metadata.get('category', 'N/A')
    response = metadata.get('response', '')
    response_len = len(response) if response else 0
    print(f"  ID: {item_id}")
    print(f"    Query: {query_text}...")
    print(f"    RFP: {rfp}, Category: {category}")
    print(f"    Embedding: {emb_info}")
    print(f"    Response: {response_len} chars")
    print()

print("\n" + "-"*100)
print(f"📦 CURRENT QUERIES (UUID): {len(current_queries)} items")
print("-"*100)
for item_id, metadata, emb_info in current_queries[:5]:  # Show first 5
    query_text = metadata.get('query', metadata.get('query_text', 'N/A'))[:60]
    print(f"  ID: {item_id}")
    print(f"    Query: {query_text}...")
    print(f"    Embedding: {emb_info}")
    print()

print("\n" + "="*100)
print("🔍 DIAGNOSIS SUMMARY")
print("="*100)
print(f"  Total items: {total}")
print(f"  Old format (q_*): {len(old_format)}")
print(f"  New format (qa_*): {len(new_format)}")
print(f"  Current queries: {len(current_queries)}")
print()

if len(old_format) > 0 and len(new_format) > 0:
    print("⚠️  WARNING: Mixed ID formats detected!")
    print("   - Old format entries may have missing/corrupt embeddings")
    print("   - Recommend: Delete query_db and re-ingest clean data")
    print()
    print("   To clean:")
    print("   1. Stop Chief Engineer service")
    print("   2. Delete ./query_db folder")
    print("   3. Restart Chief Engineer")
    print("   4. Upload PDF via Swagger")
    print("   5. Test query again")
elif len(old_format) > 0:
    print("⚠️  WARNING: Only old format entries found!")
    print("   - These may have missing/corrupt embeddings")
    print("   - Upload fresh PDF via Swagger to add new entries")
elif len(new_format) > 0:
    print("✅ GOOD: Only new format entries found!")
    print("   - These should have proper embeddings")
    print("   - If similarity still 0.0, check ChromaDB query method")
else:
    print("❌ ERROR: No pre-bid Q&A pairs found!")
    print("   - Upload PDF via Swagger first")

print("="*100)
