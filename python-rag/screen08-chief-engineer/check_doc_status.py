#!/usr/bin/env python3
"""Check PostgreSQL status of document_id 30"""

import asyncpg
import asyncio
from dotenv import load_dotenv
import os

load_dotenv()

async def check_document_status():
    # Database connection
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
        # Check historical_documents table
        result = await conn.fetchrow(
            "SELECT id, document_type, rfp_number, status, processing_metadata, processed_at FROM historical_documents WHERE id = $1",
            30
        )
        
        if result:
            print("Document Status in PostgreSQL:")
            print(f"  ID: {result['id']}")
            print(f"  Type: {result['document_type']}")
            print(f"  RFP Number: {result['rfp_number']}")
            print(f"  Status: {result['status']}")
            print(f"  Processing Metadata: {result['processing_metadata']}")
            print(f"  Processed At: {result['processed_at']}")
        else:
            print("Document ID 30 not found in historical_documents table")
            
    finally:
        await conn.close()

asyncio.run(check_document_status())
