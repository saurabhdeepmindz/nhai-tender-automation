"""Debug: Check what was actually retrieved in Step 3"""
import chromadb

# Query that was submitted
test_query_text = "Is any waiver available on EMD for small enterprises?"

print("=" * 80)
print("DEBUGGING STEP 3 - Similar Query Search")
print("=" * 80)

# Connect to ChromaDB
chroma_client = chromadb.PersistentClient(path="./query_db")
collection = chroma_client.get_collection(name="vendor_queries")

print(f"\nTotal items in collection: {collection.count()}")

# Get all items to see what's there
all_items = collection.get(include=["metadatas", "documents"])

print(f"\nAll items in ChromaDB:")
print("-" * 80)
for idx, (doc_id, doc, meta) in enumerate(zip(all_items['ids'], all_items['documents'], all_items['metadatas']), 1):
    print(f"\n{idx}. ID: {doc_id}")
    print(f"   Document: {doc[:80]}...")
    print(f"   RFP Number: {meta.get('rfp_number', 'N/A')}")
    print(f"   Category: {meta.get('category', 'N/A')}")
    print(f"   Response: {meta.get('response', 'N/A')[:80]}...")
    print(f"   Has Response: {'YES' if meta.get('response') else 'NO'}")

# Now simulate what Step 3 does - search with embedding
print("\n" + "=" * 80)
print("SIMULATING STEP 3 SEARCH")
print("=" * 80)

from embeddings import create_embedding_generator

embedding_gen = create_embedding_generator(
    provider="ollama",
    model="nomic-embed-text",
    base_url="http://localhost:11434"
)

print(f"\nGenerating embedding for: '{test_query_text}'")
query_embedding = embedding_gen.embed_query(test_query_text)
print(f"Embedding dimension: {len(query_embedding)}")

# Query ChromaDB
results = collection.query(
    query_embeddings=[query_embedding],
    n_results=5,
    include=["documents", "metadatas", "distances"]
)

print(f"\nTop 5 similar results:")
print("-" * 80)

if results and results['documents'] and results['documents'][0]:
    for idx, (doc, meta, distance) in enumerate(zip(
        results['documents'][0],
        results['metadatas'][0],
        results['distances'][0]
    ), 1):
        similarity = 1 - distance
        has_response = bool(meta.get('response'))
        
        print(f"\n{idx}. Similarity: {similarity:.3f} ({'ABOVE' if similarity > 0.5 else 'BELOW'} threshold)")
        print(f"   Document: {doc[:100]}...")
        print(f"   RFP Number: {meta.get('rfp_number', 'N/A')}")
        print(f"   Category: {meta.get('category', 'N/A')}")
        print(f"   HAS RESPONSE: {'✅ YES' if has_response else '❌ NO'}")
        if has_response:
            print(f"   Response Preview: {meta.get('response')[:100]}...")
        print(f"   Distance: {distance:.4f}")

print("\n" + "=" * 80)
print("DIAGNOSIS")
print("=" * 80)

# Check if any have responses
items_with_response = [m for m in results['metadatas'][0] if m.get('response')]
items_above_threshold = [(m, d) for m, d in zip(results['metadatas'][0], results['distances'][0]) if (1-d) > 0.5]
items_with_response_above_threshold = [(m, d) for m, d in items_above_threshold if m.get('response')]

print(f"\n✓ Total results: {len(results['documents'][0])}")
print(f"✓ Items with responses: {len(items_with_response)}")
print(f"✓ Items above threshold (0.5): {len(items_above_threshold)}")
print(f"✓ Items with responses ABOVE threshold: {len(items_with_response_above_threshold)}")

if not items_with_response_above_threshold:
    print(f"\n❌ PROBLEM: No items with responses found above similarity threshold!")
    print(f"   → This is why past_response is empty (0 chars)")
    print(f"\n   Possible causes:")
    print(f"   1. The newly submitted query is being matched (it has no response)")
    print(f"   2. Pre-bid Q&A pairs have low similarity to test query")
    print(f"   3. Threshold (0.5) is too high")
else:
    print(f"\n✅ Found {len(items_with_response_above_threshold)} items that should populate past_response")

print("\n" + "=" * 80)
