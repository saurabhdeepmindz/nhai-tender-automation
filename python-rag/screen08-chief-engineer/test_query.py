"""
Test Query Script - ChromaDB Instance 4
Tests semantic search for similar Pre-Bid Q&A pairs
"""
import sys
import os
import chromadb

# Add shared utilities to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'shared'))
from embeddings import create_embedding_generator

# Configuration
CHROMA_PERSIST_DIR = "./query_db"
COLLECTION_NAME = "vendor_queries"
OLLAMA_BASE_URL = "http://localhost:11434"
EMBEDDING_MODEL = "nomic-embed-text"

print("=" * 80)
print("CHROMADB INSTANCE 4 - QUERY TEST")
print("=" * 80)

# Initialize ChromaDB
print("\n[Step 1] Connecting to ChromaDB...")
chroma_client = chromadb.PersistentClient(path=CHROMA_PERSIST_DIR)
collection = chroma_client.get_or_create_collection(name=COLLECTION_NAME)
print(f"✓ Connected to collection: {COLLECTION_NAME}")
print(f"✓ Total items in collection: {collection.count()}")

# Initialize Embedding Generator
print("\n[Step 2] Initializing embedding generator...")
embedding_gen = create_embedding_generator(
    provider="ollama",
    model=EMBEDDING_MODEL,
    base_url=OLLAMA_BASE_URL
)
print(f"✓ Embedding generator ready")

# Test Query
print("\n[Step 3] Testing query...")
test_query = input("\nEnter your query (or press Enter for default test): ").strip()

if not test_query:
    # Default test query - similar to Q2 about MSME exemption
    test_query = "Can startups get exemption from earnest money deposit?"
    print(f"Using default query: '{test_query}'")

print(f"\n🔍 Searching for: '{test_query}'")

# Generate embedding for query
print("\n[Step 4] Generating query embedding...")
query_embedding = embedding_gen.embed_query(test_query)
print(f"✓ Embedding generated (dimension: {len(query_embedding)})")

# Search ChromaDB
print("\n[Step 5] Searching ChromaDB for similar queries...")
results = collection.query(
    query_embeddings=[query_embedding],
    n_results=3,  # Get top 3 similar queries
    include=["documents", "metadatas", "distances"]
)

# Display Results
print("\n" + "=" * 80)
print("SEARCH RESULTS - Similar Historical Queries")
print("=" * 80)

if results['ids'][0]:
    for i, (qid, doc, meta, distance) in enumerate(zip(
        results['ids'][0],
        results['documents'][0],
        results['metadatas'][0],
        results['distances'][0]
    ), 1):
        print(f"\n📌 Match #{i} - Similarity Score: {1 - distance:.3f}")
        print(f"   ID: {qid}")
        print(f"   Category: {meta['category']}")
        print(f"   RFP Section: {meta['rfp_section']}")
        print(f"   RFP Reference: {meta['rfp_number']}")
        print(f"\n   📝 Historical Query (Bidder):")
        print(f"      {meta['points_of_clarification']}")
        print(f"\n   ✅ Official Response (SRA):")
        print(f"      {meta['response']}")
        print(f"\n   📄 Context (RFP Requirement):")
        print(f"      {meta['rfp_content_requiring_clarification'][:150]}...")
        print("-" * 80)
    
    print("\n" + "=" * 80)
    print("✅ TEST SUCCESSFUL - RAG retrieval working correctly!")
    print("=" * 80)
    print("\n💡 What this means:")
    print("   • User's new query matched similar historical Q&A pairs")
    print("   • The ai_response field should display these queries AS IS")
    print("   • past_response should show the official SRA response")
    print("   • past_ref_response should show the RFP number")
else:
    print("\n⚠️  No similar queries found in ChromaDB")

print("\n" + "=" * 80)
