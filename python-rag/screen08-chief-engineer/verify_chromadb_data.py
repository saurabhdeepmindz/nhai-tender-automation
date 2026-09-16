"""
Verify ChromaDB Instance 4 (query_db) - Check all stored Q&A pairs
"""
import chromadb
import json

CHROMA_PERSIST_DIR = "./query_db"
COLLECTION_NAME = "vendor_queries"

print("=" * 100)
print("CHROMADB INSTANCE 4 - DETAILED DATA VERIFICATION")
print("=" * 100)

# Connect to ChromaDB
print(f"\n[Step 1] Connecting to ChromaDB Instance 4...")
chroma_client = chromadb.PersistentClient(path=CHROMA_PERSIST_DIR)
collection = chroma_client.get_collection(name=COLLECTION_NAME)

# Get total count
total_count = collection.count()
print(f"✓ Connected to collection: {COLLECTION_NAME}")
print(f"✓ Total items in collection: {total_count}")

# Get all items
print(f"\n[Step 2] Retrieving all items...")
results = collection.get(
    include=["documents", "metadatas", "embeddings"]
)

print(f"✓ Retrieved {len(results['ids'])} items")

# Display each item
print("\n" + "=" * 100)
print("DETAILED DATA FOR EACH Q&A PAIR:")
print("=" * 100)

for idx, (item_id, doc, metadata, embedding) in enumerate(zip(
    results['ids'],
    results['documents'],
    results['metadatas'],
    results['embeddings']
), 1):
    
    print(f"\n[Item {idx}/{len(results['ids'])}]")
    print(f"├─ ID: {item_id}")
    print(f"├─ Document (Query): {doc[:100]}..." if len(doc) > 100 else f"├─ Document (Query): {doc}")
    
    # Metadata
    print(f"├─ METADATA:")
    if metadata:
        for key, value in sorted(metadata.items()):
            value_display = str(value)[:80] + "..." if len(str(value)) > 80 else str(value)
            print(f"│  ├─ {key}: {value_display}")
    else:
        print(f"│  └─ (No metadata)")
    
    # Embedding status
    if embedding is not None and len(embedding) > 0:
        print(f"├─ EMBEDDING: ✓ Present ({len(embedding)} dimensions)")
        # Check if zero vector
        is_zero = all(abs(e) < 1e-10 for e in embedding)
        if is_zero:
            print(f"│  └─ ⚠️  WARNING: All values are zero!")
        else:
            print(f"│  └─ ✓ Valid (non-zero values)")
    else:
        print(f"├─ EMBEDDING: ❌ MISSING!")
    
    print(f"└─ END ITEM {idx}")

# Summary statistics
print("\n" + "=" * 100)
print("SUMMARY STATISTICS:")
print("=" * 100)

rfp_numbers = set()
categories = set()
has_responses = 0
has_embeddings = 0
items_with_all_fields = 0

required_fields = [
    "rfp_number", "category", "sr_no", "rfp_section",
    "rfp_content_requiring_clarification", "points_of_clarification", "response"
]

for metadata, embedding in zip(results['metadatas'], results['embeddings']):
    if metadata:
        rfp_numbers.add(metadata.get('rfp_number', 'UNKNOWN'))
        categories.add(metadata.get('category', 'UNKNOWN'))
        
        if metadata.get('response'):
            has_responses += 1
        
        # Check if all required fields present
        has_all = all(field in metadata for field in required_fields)
        if has_all:
            items_with_all_fields += 1
    
    if embedding is not None and len(embedding) > 0:
        has_embeddings += 1

print(f"Total items: {len(results['ids'])}")
print(f"Items with embeddings: {has_embeddings}/{len(results['ids'])}")
print(f"Items with responses: {has_responses}/{len(results['ids'])}")
print(f"Items with all required fields: {items_with_all_fields}/{len(results['ids'])}")
print(f"Unique RFP numbers: {rfp_numbers}")
print(f"Categories found: {sorted(categories)}")

# Verify pre-bid Q&A pairs
print("\n" + "=" * 100)
print("PRE-BID Q&A VERIFICATION:")
print("=" * 100)

expected_qas = {
    "Q1": "Can international consortium experience be considered for eligibility evaluation?",
    "Q2": "Is EMD exemption available for MSME registered bidders?",
    "Q3": "Will SRA facilitate WhatsApp Business API onboarding and verification?",
    "Q4": "Are explainable AI and audit reports mandatory for deployed models?",
    "Q5": "Is milestone-based payment allowed in addition to quarterly billing?",
    "Q6": "Will penalties be capped at a maximum limit?",
    "Q7": "Is CERT-In empanelled audit mandatory?"
}

for q_num, q_text in expected_qas.items():
    found = False
    for doc, metadata in zip(results['documents'], results['metadatas']):
        if metadata and q_text in doc:
            found = True
            response = metadata.get('response', 'NO RESPONSE')
            category = metadata.get('category', 'NO CATEGORY')
            print(f"✓ {q_num} ({category}): FOUND")
            print(f"  Response: {response[:80]}...")
            break
    
    if not found:
        print(f"❌ {q_num}: NOT FOUND")

print("\n" + "=" * 100)
print("✅ VERIFICATION COMPLETE")
print("=" * 100)
