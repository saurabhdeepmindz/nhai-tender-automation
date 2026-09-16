#!/usr/bin/env python3
"""Query Instance 3 ChromaDB for RFP document ID"""

import chromadb

chroma_dir = r"D:\SaurabhVerma\presales\rfp-pREBID\NHAI-POC-V400\NHAI-TENDER-AUTOMATION\python-rag\historical-data-service\chroma_db"
client = chromadb.PersistentClient(path=chroma_dir)
col = client.get_or_create_collection('rfp_documents')

res = col.get(where={'rfp_number': 'SRA/IT/29369/2025'}, include=['metadatas', 'documents'])
ids = res.get('ids') or []

print('Match count:', len(ids))
if ids:
    metas = res.get('metadatas') or []
    if metas:
        meta = metas[0]
        print(f'Document ID: {meta.get("document_id")}')
        print(f'RFP Number: {meta.get("rfp_number")}')
        print(f'Title: {meta.get("title")}')
        print(f'Total Chunks: {meta.get("num_chunks")}')
        print(f'Year: {meta.get("year")}')
else:
    print('No matches found')
