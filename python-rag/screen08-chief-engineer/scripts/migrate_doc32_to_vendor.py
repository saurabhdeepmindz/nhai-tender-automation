"""
Migrate document 32 from qa_documents to vendor_queries collection
Quick fix for data that was stored before the consolidation
"""

import chromadb

QUERY_DB_PATH = r"d:\SaurabhVerma\presales\rfp-pREBID\NHAI-POC-V400\NHAI-TENDER-AUTOMATION\python-rag\screen08-chief-engineer\query_db"

chroma_client = chromadb.PersistentClient(path=QUERY_DB_PATH)

print("=" * 70)
print("Migrating Document 32 from qa_documents to vendor_queries")
print("=" * 70)

# Try to get qa_documents collection
try:
    qa_col = chroma_client.get_collection("qa_documents")
    print(f"\n✓ Found qa_documents collection with {qa_col.count()} items")
    
    # Get all items from qa_documents
    all_qa = qa_col.get(include=["embeddings", "documents", "metadatas"])
    print(f"Retrieved {len(all_qa['ids'])} items")
    
    # Filter for document 32
    doc_32_indices = [i for i, meta in enumerate(all_qa['metadatas']) if meta.get('document_id') == '32']
    print(f"\nFound {len(doc_32_indices)} items for document 32 in qa_documents")
    
    if doc_32_indices:
        # Extract document 32 data
        doc_32_ids = [all_qa['ids'][i] for i in doc_32_indices]
        doc_32_embeddings = [all_qa['embeddings'][i] for i in doc_32_indices]
        doc_32_documents = [all_qa['documents'][i] for i in doc_32_indices]
        doc_32_metadatas = [all_qa['metadatas'][i] for i in doc_32_indices]
        
        # Get vendor_queries collection
        vendor_col = chroma_client.get_collection("vendor_queries")
        print(f"\n✓ Found vendor_queries collection with {vendor_col.count()} items")
        
        # Add document 32 to vendor_queries
        print(f"\nMigrating {len(doc_32_ids)} items to vendor_queries...")
        vendor_col.add(
            ids=doc_32_ids,
            embeddings=doc_32_embeddings,
            documents=doc_32_documents,
            metadatas=doc_32_metadatas
        )
        
        print(f"✓ Successfully added {len(doc_32_ids)} items to vendor_queries")
        
        # Verify
        vendor_count_after = vendor_col.count()
        print(f"\nvendor_queries now has {vendor_count_after} items total")
        
        print("\n" + "=" * 70)
        print("✅ Migration complete!")
        print("=" * 70)
    else:
        print("⚠️  No items found for document 32 in qa_documents")
        
except Exception as e:
    print(f"❌ qa_documents not found or error: {e}")
    print("\nNote: Document 32 may have been stored in vendor_queries already")
    print("or the collection structure is different.")
