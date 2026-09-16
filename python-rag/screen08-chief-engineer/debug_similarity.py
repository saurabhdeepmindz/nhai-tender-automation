"""
Debug Script: Test Similarity Between User Query and Q3
Compare actual similarity scores to understand threshold issue
"""
import sys
import os
import numpy as np
from scipy.spatial.distance import cosine

# Add shared utilities to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'shared'))
from embeddings import create_embedding_generator

print("=" * 80)
print("SIMILARITY DEBUG - User Query vs Q3 (WhatsApp)")
print("=" * 80)

# Initialize embedding generator
print("\n[Step 1] Initializing embedding generator...")
embedding_gen = create_embedding_generator(
    provider="ollama",
    model="nomic-embed-text",
    base_url="http://localhost:11434"
)
print("✓ Embedding generator ready (nomic-embed-text, 768 dimensions)")

# Define queries
q3_text = "Will SRA facilitate WhatsApp Business API onboarding and verification?"
user_query = "Will MUDA assist in WhatsApp API registration and approval?"

print(f"\n[Step 2] Comparing two queries:")
print("-" * 80)
print(f"\nQ3 (ChromaDB):\n  {q3_text}")
print(f"\nUser Query (Frontend):\n  {user_query}")

# Generate embeddings
print(f"\n[Step 3] Generating embeddings...")
print("  Embedding Q3...")
q3_embedding = embedding_gen.embed_query(q3_text)
print(f"  ✓ Q3 embedding: {len(q3_embedding)} dimensions")

print("  Embedding user query...")
user_embedding = embedding_gen.embed_query(user_query)
print(f"  ✓ User embedding: {len(user_embedding)} dimensions")

# Calculate similarity using cosine distance
print(f"\n[Step 4] Calculating similarity...")
distance = cosine(q3_embedding, user_embedding)
similarity = 1 - distance

print(f"  Cosine Distance: {distance:.4f}")
print(f"  Similarity Score: {similarity:.4f}")

# Compare to thresholds
print(f"\n[Step 5] Threshold Analysis:")
print("-" * 80)

thresholds = [0.3, 0.4, 0.5, 0.6, 0.7]
for threshold in thresholds:
    status = "✅ PASS" if similarity > threshold else "❌ FAIL"
    print(f"  Threshold {threshold:.1f}: {similarity:.4f} > {threshold:.1f}? {status}")

print(f"\n[Step 6] Current Code Configuration:")
print("-" * 80)
print(f"  Current threshold in code: 0.5")
print(f"  Actual similarity: {similarity:.4f}")

if similarity > 0.5:
    print(f"  ✅ Would MATCH (similarity {similarity:.4f} > 0.5)")
else:
    print(f"  ❌ Would NOT match (similarity {similarity:.4f} <= 0.5)")
    print(f"  Shortfall: {0.5 - similarity:.4f}")

print(f"\n[Step 7] Recommendation:")
print("-" * 80)

if similarity > 0.5:
    print(f"  ✅ Queries should match with current threshold (0.5)")
    print(f"  → If they're not matching, problem is elsewhere (data issue)")
elif similarity > 0.3:
    print(f"  ⚠️  Queries WON'T match with threshold 0.5")
    print(f"  → Need to LOWER threshold to {max(0.25, similarity - 0.05):.2f} or less")
    print(f"  → Suggested new threshold: 0.3")
    print(f"  → With 0.3 threshold: ✅ WOULD MATCH")
elif similarity > 0.2:
    print(f"  ❌ Queries barely related (similarity too low)")
    print(f"  → Lower threshold to {max(0.1, similarity - 0.05):.2f} at minimum")
else:
    print(f"  ❌ Queries are NOT semantically similar")
    print(f"  → May need different embedding model")

print(f"\n[Step 8] Summary:")
print("-" * 80)
print(f"  User Query: '{user_query}'")
print(f"  Q3 Query:   '{q3_text}'")
print(f"  Similarity: {similarity:.1%}")
print(f"  Current Threshold: 0.5 (50%)")

if similarity < 0.5:
    print(f"\n  ❌ PROBLEM CONFIRMED: Similarity below threshold")
    print(f"  → Threshold of 0.5 is too high for semantic matching")
    print(f"  → Suggest lowering to 0.3 (30%)")
else:
    print(f"\n  ✅ Similarity above threshold")
    print(f"  → If queries aren't matching, check ChromaDB data/schema")

print("\n" + "=" * 80)
