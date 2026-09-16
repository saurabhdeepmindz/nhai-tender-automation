#!/usr/bin/env python3
"""Check where live RFPs are stored vs historical documents"""

import asyncpg
import asyncio
from dotenv import load_dotenv
import os

load_dotenv()

async def check_rfp_tables():
    db_host = os.getenv("DB_HOST", "localhost")
    db_port = int(os.getenv("DB_PORT", "5432"))
    db_name = os.getenv("DB_DATABASE", "nhai_tender_db")
    db_user = os.getenv("DB_USERNAME", "postgres")
    db_password = os.getenv("DB_PASSWORD", "root")
    
    conn = await asyncpg.connect(
        host=db_host,
        port=db_port,
        database=db_name,
        user=db_user,
        password=db_password
    )
    
    try:
        print("=" * 80)
        print("RFP DOCUMENT STORAGE IN POSTGRESQL")
        print("=" * 80)
        
        # Check historical_documents table
        hist_count = await conn.fetchval("SELECT COUNT(*) FROM historical_documents")
        hist_sample = await conn.fetch("SELECT id, rfp_number, title, document_type FROM historical_documents LIMIT 3")
        
        print(f"\n1. HISTORICAL_DOCUMENTS TABLE")
        print("-" * 80)
        print(f"   Total Records: {hist_count}")
        print(f"   Primary Key: id (INTEGER)")
        print(f"   Purpose: Historical RFP documents for reference/context")
        print(f"\n   Sample Records:")
        for row in hist_sample:
            print(f"     - ID: {row['id']}, RFP: {row['rfp_number']}, Type: {row['document_type']}")
        
        # Check rfp_documents table (for live RFPs)
        rfp_count = await conn.fetchval("SELECT COUNT(*) FROM rfp_documents")
        rfp_sample = await conn.fetch("SELECT document_id, rfp_number, rfp_title FROM rfp_documents LIMIT 3")
        
        print(f"\n2. RFP_DOCUMENTS TABLE")
        print("-" * 80)
        print(f"   Total Records: {rfp_count}")
        print(f"   Primary Key: document_id (UUID)")
        print(f"   Purpose: Current/Live RFP documents for tender management")
        print(f"\n   Sample Records:")
        for row in rfp_sample:
            print(f"     - document_id: {row['document_id']}")
            print(f"       RFP Number: {row['rfp_number']}")
            print(f"       Title: {row['rfp_title']}")
        
        print("\n" + "=" * 80)
        print("KEY DIFFERENCES:")
        print("=" * 80)
        print("""
┌────────────────────────┬─────────────────────┬─────────────────────────┐
│ Attribute              │ historical_documents│ rfp_documents           │
├────────────────────────┼─────────────────────┼─────────────────────────┤
│ Primary Key            │ id (INTEGER)        │ document_id (UUID)      │
│ Purpose                │ Historical RFPs     │ Current/Live RFPs       │
│ Used For               │ RAG/AI Context      │ Tender Management       │
│ Stored In ChromaDB     │ Yes (Instance 3)    │ No                      │
│ Vectorization          │ Yes                 │ No                      │
│ Queries Linked         │ No                  │ Yes (queries table)     │
└────────────────────────┴─────────────────────┴─────────────────────────┘

ANSWER: Live RFPs are stored in 'rfp_documents' with UUID document_id,
        NOT in 'historical_documents' (which uses INTEGER id).
        """)
        
    finally:
        await conn.close()

asyncio.run(check_rfp_tables())
