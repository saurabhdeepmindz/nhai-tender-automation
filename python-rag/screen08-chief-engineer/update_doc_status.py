#!/usr/bin/env python3
"""Update document status in PostgreSQL to PROCESSED"""

import asyncpg
import asyncio
from dotenv import load_dotenv
import os
from datetime import datetime

load_dotenv()

async def update_document_status():
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
        # Update document status to PROCESSED
        result = await conn.execute(
            "UPDATE historical_documents SET status = $1, processed_at = $2, updated_at = $3 WHERE id = $4",
            'PROCESSED',
            datetime.now(),
            datetime.now(),
            30
        )
        
        print(f"✅ Document ID 30 status updated to PROCESSED")
        print(f"   Updated at: {datetime.now()}")
        
        # Verify the update
        verify = await conn.fetchrow(
            "SELECT id, status, processed_at FROM historical_documents WHERE id = $1",
            30
        )
        
        if verify:
            print(f"\n✓ Verification:")
            print(f"   ID: {verify['id']}")
            print(f"   New Status: {verify['status']}")
            print(f"   Processed At: {verify['processed_at']}")
        
    finally:
        await conn.close()

asyncio.run(update_document_status())
