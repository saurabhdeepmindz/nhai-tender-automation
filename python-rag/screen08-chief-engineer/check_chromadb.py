"""
Quick script to check ChromaDB collection contents
"""
import chromadb
import os

CHROMA_PERSIST_DIRECTORY = os.getenv("CHROMA_PERSIST_DIRECTORY", "../../chroma_db")
collection_name = os.getenv("CHIEF_ENGINEER_COLLECTION", "query_collection")

print(f"Connecting to ChromaDB at: {CHROMA_PERSIST_DIRECTORY}")
print(f"Collection name: {collection_name}")

chroma_client = chromadb.PersistentClient(path=CHROMA_PERSIST_DIRECTORY)

# List all collections
collections = chroma_client.list_collections()
print(f"\nAll collections in ChromaDB:")
for col in collections:
    print(f"  - {col.name}")

# Check the specific collection
try:
    query_collection = chroma_client.get_collection(collection_name)
    count = query_collection.count()
    print(f"\n'{collection_name}' collection:")
    print(f"  Total items: {count}")
    
    if count > 0:
        # Get a sample
        sample = query_collection.get(limit=5, include=["documents", "metadatas"])
        print(f"\nSample items (showing up to 5):")
        for i, (doc, meta) in enumerate(zip(sample['documents'], sample['metadatas']), 1):
            print(f"\n  Item {i}:")
            print(f"    Document: {doc[:150]}...")
            print(f"    Metadata: {meta}")
    else:
        print("  Collection is EMPTY - no items stored!")
        
except Exception as e:
    print(f"\nError accessing collection '{collection_name}': {str(e)}")
