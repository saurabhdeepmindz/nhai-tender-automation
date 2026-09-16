from pypdf import PdfReader
import json
import re
import pandas as pd

# Open and read the PDF
pdf_path = r"d:\SaurabhVerma\presales\rfp-pREBID\sample-test-pdfs\NEW-RFPS\SRA_Synthetic_PreBid_QA_2025_Wrapped_v2.pdf"

try:
    with open(pdf_path, 'rb') as file:
        pdf_reader = PdfReader(file)
        
        print(f"✓ PDF opened successfully")
        print(f"✓ Total pages: {len(pdf_reader.pages)}\n")
        
        full_text = ""
        for page_num, page in enumerate(pdf_reader.pages):
            text = page.extract_text()
            full_text += f"\n--- PAGE {page_num + 1} ---\n{text}"
        
        print("=" * 100)
        print("EXTRACTED TEXT FROM PDF (Full):")
        print("=" * 100)
        print(full_text)
        print("\n")
        
        # Parse the table structure manually
        print("=" * 100)
        print("PARSING TABLE STRUCTURE:")
        print("=" * 100)
        
        lines = full_text.split('\n')
        
        # Find the RFP number
        rfp_number = None
        for line in lines:
            if 'SRA/IT/29369/2025' in line:
                rfp_number = 'SRA/IT/29369/2025'
                print(f"\n✓ Found RFP Number: {rfp_number}")
                break
        
        # Extract all content
        print("\n" + "=" * 100)
        print("WHAT WILL BE CAPTURED FOR CHROMADB INSTANCE 4:")
        print("=" * 100)
        
        print(f"""
╔════════════════════════════════════════════════════════════════════════════╗
║                          METADATA STRUCTURE                                ║
╚════════════════════════════════════════════════════════════════════════════╝

For EACH Q&A pair extracted from the PDF, the following will be captured:

1. QUERY FIELDS:
   - query_id: Unique identifier (e.g., "SRA-IT-29369-2025-Q1")
   - query_text: "Can international consortium experience be considered..."
   - category: "Eligibility" (from Sr.No column)
   
2. RESPONSE FIELD:
   - response: "Yes. International consortium experience will be considered..."
   
3. METADATA FIELDS (stored as JSON in metadata column):
   ├─ rfp_number: "SRA/IT/29369/2025"
   ├─ rfp_section: "Pg 22, Sec 1.3 & 4.6"
   ├─ rfp_requirement: "Consortium eligibility as mentioned in the datasheet."
   ├─ sr_no: "1"
   ├─ source_file: "SRA_Synthetic_PreBid_QA_2025_Wrapped_v2.pdf"
   ├─ document_type: "PreBid-QA"
   ├─ extraction_date: "2026-02-04"
   └─ ingest_timestamp: "2026-02-04T10:30:00Z"

╔════════════════════════════════════════════════════════════════════════════╗
║                     SAMPLE Q&A PAIR #1                                    ║
╚════════════════════════════════════════════════════════════════════════════╝

ChromaDB Document Structure:
├─ id: "SRA-IT-29369-2025-Q1"
├─ document (TEXT): "Can international consortium experience be considered for eligibility evaluation?"
├─ embedding: [768-dimensional vector from Nomic Embed Text]
└─ metadata (JSON): {{
     "rfp_number": "SRA/IT/29369/2025",
     "rfp_section": "Pg 22, Sec 1.3 & 4.6",
     "rfp_requirement": "Consortium eligibility as mentioned in the datasheet.",
     "category": "Eligibility",
     "sr_no": "1",
     "response": "Yes. International consortium experience will be considered, subject to submission of valid documentary evidence as per pre-qualification norms.",
     "source_file": "SRA_Synthetic_PreBid_QA_2025_Wrapped_v2.pdf",
     "document_type": "PreBid-QA",
     "extraction_date": "2026-02-04",
     "ingest_timestamp": "2026-02-04T10:30:00Z"
   }}

╔════════════════════════════════════════════════════════════════════════════╗
║                     SAMPLE Q&A PAIR #2                                    ║
╚════════════════════════════════════════════════════════════════════════════╝

ChromaDB Document Structure:
├─ id: "SRA-IT-29369-2025-Q2"
├─ document (TEXT): "Is EMD exemption available for MSME registered bidders?"
├─ embedding: [768-dimensional vector from Nomic Embed Text]
└─ metadata (JSON): {{
     "rfp_number": "SRA/IT/29369/2025",
     "rfp_section": "Pg 22, Sec 2.4",
     "rfp_requirement": "Earnest Money Deposit amount specified.",
     "category": "Financial",
     "sr_no": "2",
     "response": "No. As per RFP provisions, no exemption from EMD is permitted for any category of bidder.",
     "source_file": "SRA_Synthetic_PreBid_QA_2025_Wrapped_v2.pdf",
     "document_type": "PreBid-QA",
     "extraction_date": "2026-02-04",
     "ingest_timestamp": "2026-02-04T10:30:00Z"
   }}

╔════════════════════════════════════════════════════════════════════════════╗
║                    DATABASE STORAGE BREAKDOWN                             ║
╚════════════════════════════════════════════════════════════════════════════╝

PostgreSQL TABLE: queries (if imported from PDF)
├─ query_id: "SRA-IT-29369-2025-Q1"
├─ query_text: "Can international consortium experience..."
├─ category: "Eligibility"
├─ rfp_number: "SRA/IT/29369/2025"
├─ rfp_section: "Pg 22, Sec 1.3 & 4.6"
├─ rfp_requirement: "Consortium eligibility as mentioned..."
├─ response: NULL (will be filled by Phi LLM when query is asked)
├─ past_response: "Yes. International consortium experience..." (from ChromaDB when similar query found)
├─ ai_response: "Yes. Based on your question..." (synthesized by Phi LLM)
├─ past_ref_response: "SRA/IT/29369/2025"
└─ vectorized: true

╔════════════════════════════════════════════════════════════════════════════╗
║                    FLOW & DATA USAGE                                      ║
╚════════════════════════════════════════════════════════════════════════════╝

When User asks a new query in Screen 3:
  1. New query stored in PostgreSQL (response = empty)
  2. Vectorization job triggered
  3. Screen 8 searches ChromaDB Instance 4 for similar Q&A pairs
  4. If "Can consortium be used?" query asked:
     └─ Finds "Can international consortium experience..." with 92% similarity
     └─ Extracts response: "Yes. International consortium experience..."
     └─ past_response = "Yes. International consortium experience..."
     └─ past_ref_response = "SRA/IT/29369/2025"
     └─ Phi LLM synthesizes new response using this context
     └─ ai_response = synthesized answer with reference
  5. All three fields returned to UI:
     ├─ ai_response: Generated by Phi LLM ✓
     ├─ past_ref_response: RFP numbers from similar queries ✓
     └─ past_response: Previous answer text ✓

╔════════════════════════════════════════════════════════════════════════════╗
║                  TOTAL EXPECTED Q&A PAIRS FROM PDF                        ║
╚════════════════════════════════════════════════════════════════════════════╝

Based on the PDF structure, approximately 7-8 Q&A pairs will be extracted
(one for each numbered row in the table).

Each pair will contain:
  - Query: Bidder's question/Point of Clarification
  - Response: SRA's official response
  - All RFP metadata as documented in the PDF
""")

except FileNotFoundError:
    print(f"❌ PDF file not found at: {pdf_path}")
except Exception as e:
    print(f"❌ Error: {e}")
