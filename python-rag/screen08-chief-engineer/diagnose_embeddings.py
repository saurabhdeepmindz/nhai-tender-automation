"""
Diagnose ChromaDB Embeddings Issue
Checks if embeddings are actually stored for Q1-Q7
"""
import os
import sys
import chromadb
import numpy as np
from scipy.spatial.distance import cosine

# Add shared utilities to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'shared'))
from embeddings import create_embedding_generator

# Configuration
CHROMA_PERSIST_DIR = "./query_db"
COLLECTION_NAME = "vendor_queries"
OLLAMA_BASE_URL = "http://localhost:11434"
EMBEDDING_MODEL = "nomic-embed-text"

print("=" * 80)
print("CHROMADB EMBEDDINGS DIAGNOSTIC")
print("=" * 80)

# Step 1: Connect to ChromaDB
print("\n[Step 1] Connecting to ChromaDB Instance 4...")
chroma_client = chromadb.PersistentClient(path=CHROMA_PERSIST_DIR)
collection = chroma_client.get_collection(name=COLLECTION_NAME)
print(f"✓ Connected to collection: {COLLECTION_NAME}")
print(f"✓ Total items: {collection.count()}")

# Step 2: Get Q1 data using .get() method
print("\n[Step 2] Fetching Q1 data using .get()...")
q1_results = collection.get(
    ids=["SRA-IT-29369-2025-Q1"],
    include=["documents", "metadatas", "embeddings"]
)

if not q1_results['ids']:
    print("❌ ERROR: Q1 (SRA-IT-29369-2025-Q1) not found!")
    sys.exit(1)

print(f"✓ Found Q1: {q1_results['ids'][0]}")
print(f"✓ Document: {q1_results['documents'][0][:100]}...")
print(f"✓ Response: {q1_results['metadatas'][0].get('response', 'N/A')[:100]}...")

# Step 3: Check if embeddings exist
print("\n[Step 3] Checking Q1 embeddings...")
q1_embeddings = q1_results['embeddings'][0] if q1_results['embeddings'] else None

if q1_embeddings is None:
    print("❌ CRITICAL: Q1 has NO embeddings stored!")
    print("   This explains why similarity = 0.0000")
    print("   ChromaDB returns 0 similarity when embeddings are missing")
else:
    print(f"✓ Q1 has embeddings: {len(q1_embeddings)} dimensions")
    
    # Check if embeddings are zero vector
    embedding_array = np.array(q1_embeddings)
    is_zero = np.allclose(embedding_array, 0)
    
    if is_zero:
        print("❌ CRITICAL: Q1 embeddings are ALL ZEROS!")
        print("   This is corrupted data - no semantic meaning")
    else:
        print(f"✓ Q1 embeddings have non-zero values")
        print(f"  - Min: {embedding_array.min():.6f}")
        print(f"  - Max: {embedding_array.max():.6f}")
        print(f"  - Mean: {embedding_array.mean():.6f}")
        print(f"  - Std: {embedding_array.std():.6f}")

# Step 4: Try semantic search using .query() method
print("\n[Step 4] Testing semantic search with .query()...")
print("Query: 'Can payments be released based on project milestones?'")

# Generate embedding for test query
embedding_gen = create_embedding_generator(
    provider="ollama",
    model=EMBEDDING_MODEL,
    base_url=OLLAMA_BASE_URL
)

test_query = "Can payments be released based on project milestones?"
test_embedding = embedding_gen.embed_query(test_query)
print(f"✓ Generated query embedding: {len(test_embedding)} dimensions")

# Search ChromaDB
search_results = collection.query(
    query_embeddings=[test_embedding],
    n_results=5,
    include=["documents", "metadatas", "distances"]
)

print(f"\n[Step 5] ChromaDB Search Results:")
print(f"Total results returned: {len(search_results['ids'][0])}")

for idx, (result_id, doc, meta, distance) in enumerate(zip(
    search_results['ids'][0],
    search_results['documents'][0],
    search_results['metadatas'][0],
    search_results['distances'][0]
), 1):
    similarity = 1 - distance
    print(f"\n{idx}. ID: {result_id}")
    print(f"   Query: {doc[:80]}...")
    print(f"   RFP: {meta.get('rfp_number', 'N/A')}")
    print(f"   Category: {meta.get('category', 'N/A')}")
    print(f"   Distance: {distance:.6f}")
    print(f"   Similarity: {similarity:.6f}")
    print(f"   Response: {meta.get('response', 'N/A')[:80]}...")

# Step 6: Manually calculate similarity to Q5
print("\n[Step 6] Manual Similarity Calculation:")
print("Test Query: 'Can payments be released based on project milestones?'")
print("Q5 Query: 'Is milestone-based payment allowed in addition to quarterly billing?'")

if q1_embeddings:
    # Get Q5
    q5_results = collection.get(
        ids=["SRA-IT-29369-2025-Q5"],
        include=["embeddings", "documents", "metadatas"]
    )
    
    if q5_results['ids'] and q5_results['embeddings'][0]:
        q5_embeddings = q5_results['embeddings'][0]
        q5_embedding_array = np.array(q5_embeddings)
        
        # Calculate cosine similarity
        distance = cosine(test_embedding, q5_embeddings)
        similarity = 1 - distance
        
        print(f"✓ Q5 Embeddings: {len(q5_embeddings)} dimensions")
        print(f"✓ Cosine Distance: {distance:.6f}")
        print(f"✓ Similarity Score: {similarity:.6f} ({similarity*100:.2f}%)")
        
        if similarity > 0.5:
            print(f"✅ SHOULD MATCH (similarity > 0.5 threshold)")
        else:
            print(f"❌ Below threshold (similarity <= 0.5)")
    else:
        print("❌ Q5 embeddings not found or missing")

# Step 7: Check all Q1-Q7 embeddings
print("\n[Step 7] Checking All Pre-Bid Q&A Embeddings:")
for i in range(1, 8):
    qid = f"SRA-IT-29369-2025-Q{i}"
    results = collection.get(
        ids=[qid],
        include=["embeddings", "metadatas"]
    )
    
    if results['ids']:
        emb = results['embeddings'][0] if results['embeddings'] else None
        category = results['metadatas'][0].get('category', 'N/A')
        
        if emb is None:
            status = "❌ NO EMBEDDINGS"
        elif np.allclose(np.array(emb), 0):
            status = "❌ ZERO VECTOR"
        else:
            status = f"✓ Valid ({len(emb)} dims)"
        
        print(f"  Q{i} ({category:15s}): {status}")
    else:
        print(f"  Q{i}: ❌ NOT FOUND")

print("\n" + "=" * 80)
print("DIAGNOSTIC COMPLETE")
print("=" * 80)
