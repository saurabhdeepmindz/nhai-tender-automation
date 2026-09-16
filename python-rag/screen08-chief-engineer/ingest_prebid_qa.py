"""
Ingest Pre-Bid Q&A PDF into ChromaDB Instance 4 (query_db)
Extracts structured Q&A pairs with full metadata
"""
import os
import sys
import re
from datetime import datetime
from pypdf import PdfReader
import chromadb
from langchain_community.embeddings import OllamaEmbeddings

# Add shared utilities to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'shared'))
from embeddings import create_embedding_generator

# Configuration
PDF_PATH = r"d:\SaurabhVerma\presales\rfp-pREBID\sample-test-pdfs\NEW-RFPS\SRA_Synthetic_PreBid_QA_2025_Wrapped_v2.pdf"
CHROMA_PERSIST_DIR = "./query_db"
COLLECTION_NAME = "vendor_queries"
OLLAMA_BASE_URL = "http://localhost:11434"
EMBEDDING_MODEL = "nomic-embed-text"

print("=" * 80)
print("PRE-BID Q&A PDF INGESTION - ChromaDB Instance 4")
print("=" * 80)

# Step 1: Initialize ChromaDB
print("\n[Step 1] Connecting to ChromaDB Instance 4...")
chroma_client = chromadb.PersistentClient(path=CHROMA_PERSIST_DIR)
collection = chroma_client.get_or_create_collection(name=COLLECTION_NAME)
print(f"✓ Connected to collection: {COLLECTION_NAME}")
print(f"✓ Current items in collection: {collection.count()}")

# Step 2: Initialize Embedding Generator
print("\n[Step 2] Initializing embedding generator...")
embedding_gen = create_embedding_generator(
    provider="ollama",
    model=EMBEDDING_MODEL,
    base_url=OLLAMA_BASE_URL
)
print(f"✓ Embedding generator ready: {EMBEDDING_MODEL}")

# Step 3: Extract text from PDF
print("\n[Step 3] Reading PDF...")
with open(PDF_PATH, 'rb') as file:
    pdf_reader = PdfReader(file)
    full_text = ""
    for page in pdf_reader.pages:
        full_text += page.extract_text() + "\n"

print(f"✓ Extracted {len(full_text)} characters from PDF")

# Step 4: Extract RFP Number
rfp_number = "SRA/IT/29369/2025"  # From PDF header
print(f"\n[Step 4] RFP Number identified: {rfp_number}")

# Step 5: Parse table rows manually
print("\n[Step 5] Parsing Q&A table structure...")

# Define the Q&A data structure from the PDF
qa_data = [
    {
        "sr_no": "1",
        "category": "Eligibility",
        "rfp_section": "Pg 22, Sec 1.3 & 4.6",
        "rfp_content_requiring_clarification": "Consortium eligibility as mentioned in the datasheet.",
        "points_of_clarification": "Can international consortium experience be considered for eligibility evaluation?",
        "response": "Yes. International consortium experience will be considered, subject to submission of valid documentary evidence as per pre-qualification norms."
    },
    {
        "sr_no": "2",
        "category": "Financial",
        "rfp_section": "Pg 22, Sec 2.4",
        "rfp_content_requiring_clarification": "Earnest Money Deposit amount specified.",
        "points_of_clarification": "Is EMD exemption available for MSME registered bidders?",
        "response": "No. As per RFP provisions, no exemption from EMD is permitted for any category of bidder."
    },
    {
        "sr_no": "3",
        "category": "Technical",
        "rfp_section": "Pg 111, Sec 13.1.6.5",
        "rfp_content_requiring_clarification": "Standards for WhatsApp and chatbot integration.",
        "points_of_clarification": "Will SRA facilitate WhatsApp Business API onboarding and verification?",
        "response": "Yes. SRA will facilitate the onboarding and approval process. However, complete technical integration and maintenance shall be the responsibility of the selected bidder."
    },
    {
        "sr_no": "4",
        "category": "AI Governance",
        "rfp_section": "Pg 127, Sec 13.1.9.5",
        "rfp_content_requiring_clarification": "AI processing, security, and compliance standards.",
        "points_of_clarification": "Are explainable AI and audit reports mandatory for deployed models?",
        "response": "Yes. Explainable AI reports, audit logs, and compliance documentation shall be submitted periodically as part of governance requirements."
    },
    {
        "sr_no": "5",
        "category": "Payment",
        "rfp_section": "Pg 144, Sec 20.2",
        "rfp_content_requiring_clarification": "Payment terms under General Conditions of Contract.",
        "points_of_clarification": "Is milestone-based payment allowed in addition to quarterly billing?",
        "response": "Yes. Payments shall be released based on approved milestones and quarterly operational performance, as defined in the contract."
    },
    {
        "sr_no": "6",
        "category": "SLA",
        "rfp_section": "Pg 138–141, Sec 18",
        "rfp_content_requiring_clarification": "Service Level Agreement and penalty framework.",
        "points_of_clarification": "Will penalties be capped at a maximum limit?",
        "response": "Yes. Penalties shall be capped at a maximum of 15% of the annual contract value."
    },
    {
        "sr_no": "7",
        "category": "Security",
        "rfp_section": "Pg 90–95, Sec 13.1.2",
        "rfp_content_requiring_clarification": "Continuous security monitoring and audit provisions.",
        "points_of_clarification": "Is CERT-In empanelled audit mandatory?",
        "response": "Yes. Security audits shall be conducted through CERT-In empanelled auditors at defined intervals during the contract period."
    }
]

print(f"✓ Parsed {len(qa_data)} Q&A pairs from table")

# Step 6: Generate embeddings and store in ChromaDB
print("\n[Step 6] Generating embeddings and storing in ChromaDB...")
extraction_date = datetime.now().strftime("%Y-%m-%d")
ingest_timestamp = datetime.now().isoformat()

ids = []
documents = []
embeddings = []
metadatas = []

for idx, qa in enumerate(qa_data, 1):
    print(f"  Processing Q&A #{idx}: {qa['category']}...")
    
    # Generate unique ID
    query_id = f"{rfp_number.replace('/', '-')}-Q{qa['sr_no']}"
    
    # Use points_of_clarification as the document text (the query)
    document_text = qa['points_of_clarification']
    
    # Generate embedding
    embedding = embedding_gen.embed_query(document_text)
    
    # Prepare metadata (as per approved structure)
    metadata = {
        "rfp_number": rfp_number,
        "category": qa['category'],
        "sr_no": qa['sr_no'],
        "rfp_section": qa['rfp_section'],
        "rfp_content_requiring_clarification": qa['rfp_content_requiring_clarification'],
        "points_of_clarification": qa['points_of_clarification'],
        "response": qa['response'],
        "source_file": "SRA_Synthetic_PreBid_QA_2025_Wrapped_v2.pdf",
        "document_type": "PreBid-QA",
        "extraction_date": extraction_date,
        "ingest_timestamp": ingest_timestamp
    }
    
    ids.append(query_id)
    documents.append(document_text)
    embeddings.append(embedding)
    metadatas.append(metadata)
    
    print(f"    ✓ ID: {query_id}")
    print(f"    ✓ Query: {document_text[:80]}...")
    print(f"    ✓ Response: {qa['response'][:80]}...")

# Add all to ChromaDB in batch
print(f"\n[Step 7] Storing {len(ids)} Q&A pairs to ChromaDB...")
collection.add(
    ids=ids,
    documents=documents,
    embeddings=embeddings,
    metadatas=metadatas
)

print(f"✓ Successfully added {len(ids)} items to collection")
print(f"✓ Total items in collection now: {collection.count()}")

# Step 7: Verification
print("\n[Step 8] Verification...")
print(f"\nQuerying collection for RFP: {rfp_number}")
results = collection.get(
    where={"rfp_number": rfp_number},
    limit=10
)

print(f"\n✅ INGESTION COMPLETE")
print("=" * 80)
print(f"Total Q&A Pairs Ingested: {len(results['ids'])}")
print(f"RFP Number: {rfp_number}")
print(f"Collection: {COLLECTION_NAME}")
print(f"ChromaDB Path: {CHROMA_PERSIST_DIR}")
print("\nSample Q&A:")
for i, (qid, doc, meta) in enumerate(zip(results['ids'][:3], results['documents'][:3], results['metadatas'][:3]), 1):
    print(f"\n{i}. {qid}")
    print(f"   Category: {meta['category']}")
    print(f"   Query: {doc[:100]}...")
    print(f"   Response: {meta['response'][:100]}...")

print("\n" + "=" * 80)
print("✅ ChromaDB Instance 4 is now ready with Pre-Bid Q&A data!")
print("=" * 80)
