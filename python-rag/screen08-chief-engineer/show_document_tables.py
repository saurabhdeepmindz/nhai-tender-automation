#!/usr/bin/env python3
"""Show all PostgreSQL tables with document_id field"""

import asyncpg
import asyncio
from dotenv import load_dotenv
import os

load_dotenv()

async def list_document_id_tables():
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
        # Get all tables with document_id field
        results = await conn.fetch("""
            SELECT 
                table_name,
                column_name,
                data_type
            FROM information_schema.columns
            WHERE column_name IN ('document_id', 'id')
            AND table_name IN (
                'historical_documents',
                'rfp_documents',
                'prebid_response_documents',
                'prebid_document_items',
                'document_annotations'
            )
            ORDER BY table_name, column_name
        """)
        
        print("=" * 80)
        print("POSTGRESQL TABLES WITH DOCUMENT_ID FIELD")
        print("=" * 80)
        
        current_table = None
        for row in results:
            table = row['table_name']
            column = row['column_name']
            dtype = row['data_type']
            
            if table != current_table:
                if current_table is not None:
                    print()
                print(f"\nTable: {table}")
                print("-" * 80)
                current_table = table
            
            print(f"  Field: {column:20} | Type: {dtype}")
        
        print("\n" + "=" * 80)
        print("\nKEY MAPPINGS:")
        print("-" * 80)
        print("""
1. HISTORICAL_DOCUMENTS
   - Primary key: id (integer)
   - This is where RFP metadata is stored
   - Document ID 30 is stored here
   - Field name: id

2. RFP_DOCUMENTS
   - Primary key: document_id (UUID)
   - Stores RFP content with UUID
   - Field name: document_id

3. PREBID_RESPONSE_DOCUMENTS
   - Primary key: document_id (UUID)
   - Stores pre-bid responses
   - Field name: document_id

4. PREBID_DOCUMENT_ITEMS
   - Foreign key: document_id (UUID)
   - Links to prebid_response_documents
   - Field name: document_id

5. DOCUMENT_ANNOTATIONS
   - Foreign key: document_id (UUID)
   - Links to rfp_documents
   - Field name: document_id
        """)
        
    finally:
        await conn.close()

asyncio.run(list_document_id_tables())
