#!/usr/bin/env python3
"""Show exactly where document ID 30 is stored in PostgreSQL"""

import asyncpg
import asyncio
from dotenv import load_dotenv
import os

load_dotenv()

async def find_document_30():
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
            "SELECT * FROM historical_documents WHERE id = $1",
            30
        )
        
        if result:
            print("=" * 80)
            print("DOCUMENT ID 30 LOCATION")
            print("=" * 80)
            print(f"\nTable Name: historical_documents")
            print(f"Field Name: id")
            print(f"Data Type: INTEGER")
            print("\n" + "-" * 80)
            print("FULL RECORD:")
            print("-" * 80)
            for key, value in result.items():
                print(f"  {key:25} = {value}")
        else:
            print("Document ID 30 not found in historical_documents table")
            
    finally:
        await conn.close()

asyncio.run(find_document_30())
