"""
ChromaDB Verification & Reconciliation Helper
Called after PDF ingestion to verify all rows were stored correctly
"""
import chromadb
import logging

logger = logging.getLogger(__name__)

def verify_ingestion_reconciliation(pdf_rows_count: int, chroma_persist_dir: str = "./query_db", collection_name: str = "vendor_queries", report_duplicates: bool = True) -> dict:
    """
    Verify that PDF rows were correctly ingested into ChromaDB
    
    Args:
        pdf_rows_count: Number of rows extracted from PDF
        chroma_persist_dir: Path to ChromaDB persistence directory
        collection_name: Name of ChromaDB collection
    
    Returns:
        dict with reconciliation results
    """
    
    # In-depth logging initialization
    logger.info("[verify_ingestion_reconciliation] ===== STARTING VERIFICATION =====")
    logger.info(f"[verify_ingestion_reconciliation] PDF rows expected: {pdf_rows_count}")
    logger.info(f"[verify_ingestion_reconciliation] ChromaDB path: {chroma_persist_dir}")
    logger.info(f"[verify_ingestion_reconciliation] Collection name: {collection_name}")
    
    print("\n" + "=" * 100)
    print("INGESTION RECONCILIATION VERIFICATION")
    print("=" * 100)
    
    try:
        # Connect to ChromaDB with logging
        logger.info("[verify_ingestion_reconciliation] Attempting to connect to ChromaDB...")
        chroma_client = chromadb.PersistentClient(path=chroma_persist_dir)
        logger.info("[verify_ingestion_reconciliation] ✅ ChromaDB client initialized successfully")
        
        logger.info(f"[verify_ingestion_reconciliation] Retrieving collection '{collection_name}'...")
        collection = chroma_client.get_collection(name=collection_name)
        logger.info(f"[verify_ingestion_reconciliation] ✅ Collection '{collection_name}' retrieved successfully")
        
        # Get all items with detailed logging
        logger.info("[verify_ingestion_reconciliation] Fetching all items from collection (include: documents, metadatas, embeddings)...")
        results = collection.get(
            include=["documents", "metadatas", "embeddings"]
        )
        logger.info(f"[verify_ingestion_reconciliation] ✅ Retrieved {len(results['ids'])} items from ChromaDB")
        
        chromadb_rows_count = len(results['ids'])
        items_with_embeddings = 0
        items_with_responses = 0
        items_details = []
        
        # Check embeddings and responses with detailed logging
        logger.info("[verify_ingestion_reconciliation] Analyzing each item for completeness...")
        for idx, (item_id, metadata, embedding) in enumerate(zip(results['ids'], results['metadatas'], results['embeddings']), 1):
            # Fix: Check embedding properly (it's a list/array, can't use direct boolean check)
            has_embedding = embedding is not None and len(embedding) > 0
            has_response = metadata and metadata.get('response')
            
            if has_embedding:
                items_with_embeddings += 1
                embedding_dim = len(embedding)
                logger.debug(f"  [Item {idx}/{chromadb_rows_count}] ID: {item_id} | Embedding: ✅ ({embedding_dim} dimensions)")
            else:
                logger.warning(f"  [Item {idx}/{chromadb_rows_count}] ID: {item_id} | Embedding: ❌ MISSING")
            
            if has_response:
                items_with_responses += 1
                response_len = len(metadata.get('response', '')) if metadata else 0
                logger.debug(f"  [Item {idx}/{chromadb_rows_count}] ID: {item_id} | Response: ✅ ({response_len} chars)")
            else:
                logger.warning(f"  [Item {idx}/{chromadb_rows_count}] ID: {item_id} | Response: ❌ MISSING")
            
            items_details.append({
                "id": item_id,
                "has_embedding": has_embedding,
                "has_response": has_response
            })
        
        # Reconciliation analysis with in-depth logging
        logger.info("[verify_ingestion_reconciliation] ===== RECONCILIATION ANALYSIS =====")
        logger.info(f"[verify_ingestion_reconciliation] PDF rows extracted: {pdf_rows_count}")
        logger.info(f"[verify_ingestion_reconciliation] ChromaDB rows stored: {chromadb_rows_count}")
        
        if pdf_rows_count == chromadb_rows_count:
            logger.info(f"[verify_ingestion_reconciliation] ✅ PERFECT MATCH - All {pdf_rows_count} rows ingested successfully")
            match_status = "PERFECT MATCH"
        else:
            gap = abs(pdf_rows_count - chromadb_rows_count)
            logger.warning(f"[verify_ingestion_reconciliation] ❌ GAP DETECTED - Expected {pdf_rows_count} but found {chromadb_rows_count} (difference: {gap} rows)")
            match_status = "GAP DETECTED"
        
        # Data quality analysis with logging
        logger.info("[verify_ingestion_reconciliation] ===== DATA QUALITY ANALYSIS =====")
        logger.info(f"[verify_ingestion_reconciliation] Items with embeddings: {items_with_embeddings}/{chromadb_rows_count}")
        logger.info(f"[verify_ingestion_reconciliation] Items with responses: {items_with_responses}/{chromadb_rows_count}")
        
        if items_with_embeddings == chromadb_rows_count:
            logger.info(f"[verify_ingestion_reconciliation] ✅ Embedding Status: ALL ITEMS HAVE VALID EMBEDDINGS")
        else:
            missing_embeddings = chromadb_rows_count - items_with_embeddings
            logger.warning(f"[verify_ingestion_reconciliation] ⚠️  Embedding Status: {missing_embeddings} items MISSING EMBEDDINGS")
        
        if items_with_responses == chromadb_rows_count:
            logger.info(f"[verify_ingestion_reconciliation] ✅ Response Status: ALL ITEMS HAVE RESPONSES")
        else:
            missing_responses = chromadb_rows_count - items_with_responses
            logger.warning(f"[verify_ingestion_reconciliation] ⚠️  Response Status: {missing_responses} items MISSING RESPONSES")
        
        # Print reconciliation report (console output)
        print("\n📊 RECONCILIATION REPORT:")
        print("-" * 100)
        print(f"  Rows extracted from PDF:        {pdf_rows_count}")
        print(f"  Rows stored in ChromaDB:        {chromadb_rows_count}")
        print(f"  Match Status:                   ", end="")
        
        if pdf_rows_count == chromadb_rows_count:
            print(f"✅ PERFECT MATCH (x = y = {pdf_rows_count})")
        else:
            gap = abs(pdf_rows_count - chromadb_rows_count)
            print(f"❌ GAP DETECTED (difference: {gap} rows)")
        
        print("-" * 100)
        print(f"\n📦 DATA QUALITY CHECK:")
        print("-" * 100)
        print(f"  Items with valid embeddings:    {items_with_embeddings}/{chromadb_rows_count}")
        print(f"  Items with responses:           {items_with_responses}/{chromadb_rows_count}")
        
        if items_with_embeddings == chromadb_rows_count:
            print(f"  Embedding status:               ✅ ALL ITEMS HAVE EMBEDDINGS")
        else:
            print(f"  Embedding status:               ⚠️  {chromadb_rows_count - items_with_embeddings} items missing embeddings")
        
        if items_with_responses == chromadb_rows_count:
            print(f"  Response status:                ✅ ALL ITEMS HAVE RESPONSES")
        else:
            print(f"  Response status:                ⚠️  {chromadb_rows_count - items_with_responses} items missing responses")
        
        print("-" * 100)
        print(f"\n✅ VERIFICATION COMPLETE\n")
        
        # Final summary logging
        logger.info("[verify_ingestion_reconciliation] ===== VERIFICATION COMPLETE =====")
        logger.info(f"[verify_ingestion_reconciliation] Summary: {chromadb_rows_count}/{pdf_rows_count} rows verified, {items_with_embeddings} with embeddings, {items_with_responses} with responses")
        
        return {
            "success": True,
            "pdf_rows": pdf_rows_count,
            "chromadb_rows": chromadb_rows_count,
            "match": pdf_rows_count == chromadb_rows_count,
            "match_status": match_status,
            "items_with_embeddings": items_with_embeddings,
            "items_with_responses": items_with_responses,
            "all_embeddings_present": items_with_embeddings == chromadb_rows_count,
            "all_responses_present": items_with_responses == chromadb_rows_count,
            "items_details": items_details
        }
        
    except Exception as e:
        print(f"\n❌ VERIFICATION FAILED: {str(e)}\n")
        logger.error(f"[verify_ingestion_reconciliation] ❌ VERIFICATION FAILED: {str(e)}", exc_info=True)
        logger.warning(f"[verify_ingestion_reconciliation] Exception details - Type: {type(e).__name__}")
        return {
            "success": False,
            "error": str(e)
        }
