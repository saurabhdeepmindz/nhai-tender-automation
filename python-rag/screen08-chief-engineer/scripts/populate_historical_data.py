"""
Populate Historical RFP Data into ChromaDB (Screen 7)

This script uploads historical RFP documents and responses to enable
past_ref_response population in Chief Engineer queries.
"""

import asyncio
import httpx
import json
import os
import tempfile
from typing import List, Dict
from pathlib import Path

SCREEN7_URL = "http://localhost:8000"

# Sample historical RFP data
HISTORICAL_RFPS = [
    {
        "document_id": "rfp-nh-2024-001",
        "rfp_number": "NH-2024-001",
        "title": "National Highway Construction - Section A",
        "text": """
Bid Security Requirements:
- Amount: 2% of estimated project cost (minimum Rs. 50 lakhs)
- Validity: 180 days from bid submission date
- Form: Bank Guarantee or Demand Draft from scheduled bank
- Forfeiture: If bidder withdraws bid or fails to sign contract within validity period

EMD (Earnest Money Deposit):
- Amount: Rs. 2 Crores
- Validity: 90 days beyond bid validity
- Acceptable forms: Bank Guarantee, Fixed Deposit Receipt
- Refund: Within 30 days of contract award to unsuccessful bidders
        """,
        "metadata": {
            "category": "financial",
            "year": 2024,
            "project_type": "highway_construction"
        }
    },
    {
        "document_id": "rfp-nh-2024-002",
        "rfp_number": "NH-2024-002",
        "title": "Bridge Construction Project - Phase 2",
        "text": """
Performance Guarantee Requirements:
- Amount: 10% of contract value
- Validity: Until 60 days after completion certificate
- Form: Bank Guarantee from approved bank
- Release: After defect liability period

Bid Bond Specifications:
- Amount: Rs. 1.5 Crores
- Validity: 120 days from last date of bid submission
- Submission: With technical bid documents
- Cancellation: Upon signing of contract or bid rejection
        """,
        "metadata": {
            "category": "contractual",
            "year": 2024,
            "project_type": "bridge_construction"
        }
    },
    {
        "document_id": "rfp-nh-2023-015",
        "rfp_number": "NH-2023-015",
        "title": "Road Widening Project - Eastern Corridor",
        "text": """
Bid Security Details:
- EMD Amount: 1% of estimated cost (minimum Rs. 25 lakhs)
- Validity Period: 150 days from bid opening
- Acceptable Forms: Bank Guarantee, FDR, Demand Draft
- Forfeiture Conditions:
  * Withdrawal of bid during validity
  * Non-acceptance of contract corrections
  * Failure to execute contract within 15 days

Technical Qualifications:
- Minimum annual turnover: Rs. 50 Crores
- Past experience: 3 similar projects in last 5 years
- Net worth: Minimum Rs. 20 Crores
        """,
        "metadata": {
            "category": "technical",
            "year": 2023,
            "project_type": "road_widening"
        }
    }
]

async def upload_rfp_document(client: httpx.AsyncClient, rfp: Dict, temp_dir: str) -> bool:
    """Upload single RFP document to Screen 7"""
    try:
        # Save text content to temporary file
        file_path = os.path.join(temp_dir, f"{rfp['document_id']}.txt")
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(rfp["text"])
        
        # Prepare form data as required by Screen 7 /api/rag/ingest endpoint
        form_data = {
            "document_id": rfp["document_id"],
            "document_type": "rfp",
            "file_path": file_path,
            "file_name": f"{rfp['document_id']}.txt",
            "rfp_number": rfp["rfp_number"],
            "title": rfp["title"],
            "metadata": json.dumps(rfp.get("metadata", {}))
        }
        
        response = await client.post(
            f"{SCREEN7_URL}/api/rag/ingest/sync",
            data=form_data,
            timeout=60.0
        )
        response.raise_for_status()
        print(f"✓ Uploaded: {rfp['rfp_number']} - {rfp['title']}")
        return True
    except Exception as e:
        print(f"✗ Failed to upload {rfp['rfp_number']}: {str(e)}")
        return False

async def populate_historical_data():
    """Populate ChromaDB with historical RFP data"""
    print("="*70)
    print("Populating Historical RFP Data (Screen 7 - ChromaDB)")
    print("="*70)
    
    # Create temporary directory for RFP files
    with tempfile.TemporaryDirectory() as temp_dir:
        print(f"Created temporary directory: {temp_dir}")
        
        async with httpx.AsyncClient() as client:
            # Check Screen 7 health
            try:
                health = await client.get(f"{SCREEN7_URL}/api/health", timeout=5.0)
                health.raise_for_status()
                print(f"✓ Screen 7 is healthy: {SCREEN7_URL}")
            except Exception as e:
                print(f"✗ Screen 7 not available: {str(e)}")
                print("Please start Screen 7 service first!")
                return
            
            # Upload documents
            print(f"\nUploading {len(HISTORICAL_RFPS)} historical RFP documents...")
            results = []
            for rfp in HISTORICAL_RFPS:
                result = await upload_rfp_document(client, rfp, temp_dir)
                results.append(result)
                await asyncio.sleep(0.5)  # Rate limiting
            
            # Summary
            success_count = sum(results)
            print("\n" + "="*70)
            print(f"Upload Summary:")
            print(f"  Total: {len(HISTORICAL_RFPS)}")
            print(f"  Success: {success_count}")
            print(f"  Failed: {len(HISTORICAL_RFPS) - success_count}")
            print("="*70)
            
            if success_count > 0:
                print("\n✅ Historical data populated successfully!")
                print("   Now queries will return past_ref_response with relevant RFP data")
            else:
                print("\n❌ Failed to populate historical data")

if __name__ == "__main__":
    asyncio.run(populate_historical_data())
