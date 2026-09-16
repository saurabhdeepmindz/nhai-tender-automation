"""
Quick embedding comparison test
"""
import chromadb
import numpy as np
from sys import path
path.insert(0, '../shared')
from embeddings import create_embedding_generator, EmbeddingProvider

print("\n" + "="*80)
print("QUICK EMBEDDING COMPARISON TEST")
print("="*80)

# Initialize
query_db_path = "./query_db"
client = chromadb.PersistentClient(path=query_db_path)
collection = client.get_collection(name="vendor_queries")

embedding_gen = create_embedding_generator(
    provider=EmbeddingProvider.OLLAMA,
    model="nomic-embed-text:latest"
)

# Test query
test_query = "Is EMD exemption available for MSME registered bidders?"
print(f"\nTest Query: {test_query}")

# Generate embedding
query_emb = embedding_gen.embed_query(text=test_query)
print(f"Query embedding: {len(query_emb)} dims, norm={np.linalg.norm(query_emb):.4f}")

# Search ChromaDB
results = collection.query(
    query_embeddings=[query_emb],
    n_results=5,
    include=["metadatas", "distances"]
)

print(f"\nTop 5 Results:")
for idx, (result_id, metadata, distance) in enumerate(
    zip(results['ids'][0], results['metadatas'][0], results['distances'][0]), 1
):
    similarity = 1 - distance
    query_text = metadata.get('query', metadata.get('points_of_clarification', 'N/A'))[:60]
    print(f"\n[{idx}] {result_id}")
    print(f"    Query: {query_text}")
    print(f"    Distance: {distance:.6f}")
    print(f"    Similarity: {similarity:.6f}")

print("\n" + "="*80)
