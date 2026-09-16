"""
Debug: Check what's in vendor_queries collection
"""

import chromadb

QUERY_DB_PATH = r"d:\SaurabhVerma\presales\rfp-pREBID\NHAI-POC-V400\NHAI-TENDER-AUTOMATION\python-rag\screen08-chief-engineer\query_db"

chroma_client = chromadb.PersistentClient(path=QUERY_DB_PATH)

print("=" * 70)
print("Checking vendor_queries collection contents")
print("=" * 70)

vc = chroma_client.get_collection("vendor_queries")
print(f"\nTotal items in vendor_queries: {vc.count()}")

# Get all items
all_items = vc.get(include=["metadatas", "documents"])

print(f"\nDocument IDs in vendor_queries:")
doc_ids = {}
for i, meta in enumerate(all_items['metadatas']):
    doc_id = meta.get('document_id')
    if doc_id not in doc_ids:
        doc_ids[doc_id] = []
    doc_ids[doc_id].append({
        'id': all_items['ids'][i],
        'document': all_items['documents'][i][:100] if all_items['documents'][i] else 'N/A'
    })

for doc_id in sorted(doc_ids.keys()):
    print(f"\n  Document {doc_id}: {len(doc_ids[doc_id])} items")
    for item in doc_ids[doc_id][:2]:  # Show first 2 items
        print(f"    - ID: {item['id']}")
        print(f"      Doc: {item['document']}...")

# Check specifically for document 32
print(f"\n" + "=" * 70)
print(f"Detailed check for document 32:")
print("=" * 70)

if '32' in doc_ids:
    print(f"✓ Found {len(doc_ids['32'])} items for document 32")
    for item in doc_ids['32']:
        print(f"  - {item}")
else:
    print("✗ Document 32 not found in vendor_queries!")
    print("\nAvailable document IDs:")
    print(doc_ids.keys())
