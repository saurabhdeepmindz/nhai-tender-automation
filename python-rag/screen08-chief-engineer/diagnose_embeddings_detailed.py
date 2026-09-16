"""
Diagnose ChromaDB Embeddings - Check if embeddings are valid
"""
import chromadb
import numpy as np

query_db_path = "./query_db"

print("\n" + "="*100)
print("EMBEDDING DIAGNOSIS - Checking Vector Quality")
print("="*100)

client = chromadb.PersistentClient(path=query_db_path)
collection = client.get_collection(name="vendor_queries")

# Get ALL items with embeddings
results = collection.get(
    include=["documents", "metadatas", "embeddings"]
)

total = len(results['ids'])
print(f"\n📊 Total items: {total}")

# Analyze embeddings
for idx, (item_id, metadata, embedding) in enumerate(zip(results['ids'], results['metadatas'], results['embeddings']), 1):
    if embedding is not None and len(embedding) > 0:
        emb_array = np.array(embedding)
        
        # Check if embedding is all zeros
        is_all_zeros = np.all(emb_array == 0)
        
        # Calculate embedding statistics
        emb_mean = np.mean(emb_array)
        emb_std = np.std(emb_array)
        emb_min = np.min(emb_array)
        emb_max = np.max(emb_array)
        emb_norm = np.linalg.norm(emb_array)
        
        query_text = metadata.get('query', metadata.get('points_of_clarification', 'N/A'))[:60]
        rfp = metadata.get('rfp_number', 'N/A')
        
        print(f"\n{'='*100}")
        print(f"[{idx}/{total}] ID: {item_id}")
        print(f"  Query: {query_text}...")
        print(f"  RFP: {rfp}")
        print(f"  Embedding Dimension: {len(embedding)}")
        print(f"  All Zeros: {'❌ YES - CORRUPT!' if is_all_zeros else '✅ NO'}")
        print(f"  Mean: {emb_mean:.6f}")
        print(f"  Std Dev: {emb_std:.6f}")
        print(f"  Min: {emb_min:.6f}")
        print(f"  Max: {emb_max:.6f}")
        print(f"  L2 Norm: {emb_norm:.6f}")
        
        if is_all_zeros:
            print(f"  ⚠️  PROBLEM: This embedding is all zeros - ChromaDB cannot compute similarity!")
        elif emb_norm < 0.01:
            print(f"  ⚠️  PROBLEM: Embedding norm too small - may cause similarity issues")
        else:
            print(f"  ✅ Embedding looks valid")
    else:
        print(f"\n[{idx}/{total}] ID: {item_id}")
        print(f"  ❌ NO EMBEDDING!")

# Now test a sample query
print(f"\n\n" + "="*100)
print("TESTING SIMILARITY SEARCH")
print("="*100)

test_query = "Are startups eligible for EMD relaxation?"
print(f"\nTest Query: {test_query}")

try:
    # Generate embedding using same method as chief engineer
    from sys import path
    path.insert(0, '../shared')
    from embeddings import create_embedding_generator, EmbeddingProvider
    
    embedding_gen = create_embedding_generator(
        provider=EmbeddingProvider.OLLAMA,
        model="nomic-embed-text:latest"
    )
    
    query_embedding = embedding_gen.embed_query(text=test_query)
    print(f"\nQuery Embedding Generated:")
    print(f"  Dimension: {len(query_embedding)}")
    print(f"  Mean: {np.mean(query_embedding):.6f}")
    print(f"  Std: {np.std(query_embedding):.6f}")
    print(f"  Norm: {np.linalg.norm(query_embedding):.6f}")
    
    # Query ChromaDB
    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=5,
        include=["documents", "metadatas", "distances"]
    )
    
    print(f"\n\nChromaDB Query Results:")
    print(f"  Results returned: {len(results['ids'][0])}")
    
    for idx, (result_id, doc, metadata, distance) in enumerate(
        zip(results['ids'][0], results['documents'][0], results['metadatas'][0], results['distances'][0]), 1
    ):
        similarity = max(0, 1 - distance)
        query_text = metadata.get('query', metadata.get('points_of_clarification', doc))[:60]
        
        print(f"\n  [{idx}] ID: {result_id}")
        print(f"      Query: {query_text}...")
        print(f"      Distance: {distance:.6f}")
        print(f"      Similarity: {similarity:.6f}")
        
        if distance >= 1.0:
            print(f"      ⚠️  Distance >= 1.0 means embeddings are orthogonal/uncorrelated")
        elif similarity > 0.5:
            print(f"      ✅ Good match!")

except Exception as e:
    print(f"\n❌ Error during test: {str(e)}")
    import traceback
    traceback.print_exc()

print(f"\n" + "="*100)
print("DIAGNOSIS COMPLETE")
print("="*100)
