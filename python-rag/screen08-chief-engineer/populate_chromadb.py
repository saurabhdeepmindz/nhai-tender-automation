"""
Populate ChromaDB with test queries for semantic search testing
"""
import os
import chromadb
from langchain_community.embeddings import OllamaEmbeddings
from datetime import datetime
import uuid

# Configuration
CHROMA_PERSIST_DIRECTORY = os.getenv("CHROMA_PERSIST_DIRECTORY", "../../chroma_db")
collection_name = os.getenv("CHIEF_ENGINEER_COLLECTION", "query_collection")

print(f"Connecting to ChromaDB at: {CHROMA_PERSIST_DIRECTORY}")
print(f"Collection name: {collection_name}")

# Initialize ChromaDB
chroma_client = chromadb.PersistentClient(path=CHROMA_PERSIST_DIRECTORY)
query_collection = chroma_client.get_or_create_collection(collection_name)

# Initialize embedding model
print("\nInitializing embedding model...")
embedding_generator = OllamaEmbeddings(
    model=os.getenv("LLM_MODEL", "llama2"),
    base_url=os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
)

# Test queries to insert
test_queries = [
    {
        "query_text": "What is the required amount and validity period for bid security in this tender?",
        "metadata": {
            "query_id": str(uuid.uuid4()),
            "query_type": "bid_security",
            "rfp_number": "NHAI/TEST/2026/001",
            "created_at": datetime.now().isoformat(),
            "category": "commercial"
        }
    },
    {
        "query_text": "In which format and by what deadline must the bid security be submitted?",
        "metadata": {
            "query_id": str(uuid.uuid4()),
            "query_type": "bid_security_submission",
            "rfp_number": "NHAI/TEST/2026/001",
            "created_at": datetime.now().isoformat(),
            "category": "commercial"
        }
    },
    {
        "query_text": "Under what conditions can the bid security be forfeited by the authority?",
        "metadata": {
            "query_id": str(uuid.uuid4()),
            "query_type": "bid_security_forfeiture",
            "rfp_number": "NHAI/TEST/2026/001",
            "created_at": datetime.now().isoformat(),
            "category": "commercial"
        }
    },
    {
        "query_text": "Please clarify the bid security and performance guarantee requirements, including submission format, validity, and forfeiture conditions.",
        "metadata": {
            "query_id": str(uuid.uuid4()),
            "query_type": "bid_security_comprehensive",
            "rfp_number": "NHAI/TEST/2026/001",
            "created_at": datetime.now().isoformat(),
            "category": "commercial"
        }
    }
]

print(f"\nInserting {len(test_queries)} queries into ChromaDB...")

for i, query_data in enumerate(test_queries, 1):
    print(f"\n[{i}/{len(test_queries)}] Processing query: {query_data['query_text'][:80]}...")
    
    # Generate embedding
    print(f"  Generating embedding...")
    embedding = embedding_generator.embed_query(query_data["query_text"])
    print(f"  Embedding dimension: {len(embedding)}")
    
    # Insert into ChromaDB
    query_collection.add(
        ids=[query_data["metadata"]["query_id"]],
        embeddings=[embedding],
        documents=[query_data["query_text"]],
        metadatas=[query_data["metadata"]]
    )
    print(f"  ✓ Inserted successfully")

# Verify insertion
total_count = query_collection.count()
print(f"\n{'='*60}")
print(f"Population complete!")
print(f"Total items in '{collection_name}': {total_count}")
print(f"{'='*60}")

# Show a sample
print("\nSample items from collection:")
sample = query_collection.get(limit=3, include=["documents", "metadatas"])
for i, (doc, meta) in enumerate(zip(sample['documents'], sample['metadatas']), 1):
    print(f"\n{i}. {doc[:100]}...")
    print(f"   Category: {meta.get('category')}, Type: {meta.get('query_type')}")
