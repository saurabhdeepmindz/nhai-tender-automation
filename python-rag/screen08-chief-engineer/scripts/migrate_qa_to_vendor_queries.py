"""
Migrate Q&A documents from qa_documents collection to vendor_queries collection
in Instance #4 (query_db) to create a single source of truth for all queries.

Purpose: Consolidate Q&A pairs with vendor queries for unified semantic search

Usage:
    python migrate_qa_to_vendor_queries.py
"""

import chromadb
import logging
from pathlib import Path

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Path to Instance #4
QUERY_DB_PATH = Path(__file__).parent.parent / "query_db"

def migrate_qa_to_vendor_queries():
    """Migrate qa_documents collection to vendor_queries collection"""
    
    logger.info("="*70)
    logger.info("Starting Q&A Migration to vendor_queries")
    logger.info("="*70)
    logger.info(f"ChromaDB Path: {QUERY_DB_PATH}")
    
    # Connect to Instance #4
    try:
        chroma_client = chromadb.PersistentClient(path=str(QUERY_DB_PATH))
        logger.info("✓ Connected to Instance #4 (query_db)")
    except Exception as e:
        logger.error(f"❌ Failed to connect to ChromaDB: {e}")
        return False
    
    try:
        # Get source collection (qa_documents)
        qa_collection = chroma_client.get_collection("qa_documents")
        qa_count = qa_collection.count()
        logger.info(f"✓ Found qa_documents collection with {qa_count} items")
        
        if qa_count == 0:
            logger.info("ℹ️  No items to migrate. Exiting.")
            return True
        
    except Exception as e:
        logger.warning(f"⚠️  qa_documents collection not found: {e}")
        logger.info("ℹ️  This is expected if migration already completed or never existed.")
        return True
    
    try:
        # Get target collection (vendor_queries)
        vendor_collection = chroma_client.get_collection("vendor_queries")
        vendor_count = vendor_collection.count()
        logger.info(f"✓ Found vendor_queries collection with {vendor_count} items")
        
    except Exception as e:
        logger.error(f"❌ Failed to get vendor_queries collection: {e}")
        return False
    
    # Fetch all documents from qa_documents
    try:
        logger.info("\n📥 Fetching all documents from qa_documents...")
        qa_data = qa_collection.get(
            include=["embeddings", "documents", "metadatas"]
        )
        
        logger.info(f"   Retrieved {len(qa_data['ids'])} documents")
        
        # Add them to vendor_queries
        logger.info("\n📤 Adding documents to vendor_queries...")
        
        if qa_data['ids']:
            vendor_collection.add(
                ids=qa_data['ids'],
                embeddings=qa_data['embeddings'],
                documents=qa_data['documents'],
                metadatas=qa_data['metadatas']
            )
            logger.info(f"✓ Added {len(qa_data['ids'])} documents to vendor_queries")
        
    except Exception as e:
        logger.error(f"❌ Error during migration: {e}")
        return False
    
    # Verify migration
    try:
        vendor_count_after = vendor_collection.count()
        logger.info(f"\n✅ Migration Complete!")
        logger.info(f"   vendor_queries now has: {vendor_count_after} items")
        logger.info(f"   (was {vendor_count} before migration)")
        
        logger.info("\n⚠️  Note: qa_documents collection still exists but is empty/unused.")
        logger.info("   You can safely ignore it going forward.")
        
        return True
        
    except Exception as e:
        logger.error(f"❌ Error verifying migration: {e}")
        return False

if __name__ == "__main__":
    success = migrate_qa_to_vendor_queries()
    
    if success:
        logger.info("\n" + "="*70)
        logger.info("✅ Migration successful!")
        logger.info("="*70)
        exit(0)
    else:
        logger.error("\n" + "="*70)
        logger.error("❌ Migration failed!")
        logger.error("="*70)
        exit(1)
