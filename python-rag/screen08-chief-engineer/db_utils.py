"""
Database utility for saving AI responses back to PostgreSQL queries table
"""
import logging
from datetime import datetime
from typing import Optional
from database import get_database

logger = logging.getLogger(__name__)

async def save_ai_response_to_db(
    query_id: str,
    ai_response: str,
    past_ref_response: Optional[str] = None,
    past_response: Optional[str] = None,
    confidence: float = 0.0
) -> bool:
    """
    Save AI-generated response and metadata back to PostgreSQL queries table
    
    Args:
        query_id: UUID of the query
        ai_response: The AI-generated response text
        past_ref_response: RFP references extracted from similar queries
        past_response: Formatted responses from similar queries
        confidence: Confidence score (0.0 to 1.0)
    
    Returns:
        bool: True if successful, False otherwise
    """
    try:
        pool = get_database()
        if pool is None:
            logger.error("❌ Database pool is not initialized. Call init_database() on startup.")
            return False
        
        update_query = """
            UPDATE queries
            SET 
                ai_response = $1,
                past_ref_response = $2,
                past_response = $3,
                ai_processed = true,
                confidence = $4,
                processed_at = $5
            WHERE query_id = $6::uuid
        """
        
        async with pool.acquire() as conn:
            result = await conn.execute(
                update_query,
                ai_response,
                past_ref_response,
                past_response,
                confidence,
                datetime.now(),
                query_id
            )
            
            # asyncpg returns a status string like "UPDATE 1"
            try:
                rows_affected = int(result.split()[-1])
            except Exception:
                rows_affected = 0
            
            if rows_affected > 0:
                logger.info(f"✅ Saved AI response to PostgreSQL for query {query_id}")
                logger.info(f"   - ai_response: {len(ai_response)} chars")
                logger.info(f"   - past_ref_response: {len(past_ref_response) if past_ref_response else 0} chars")
                logger.info(f"   - past_response: {len(past_response) if past_response else 0} chars")
                logger.info(f"   - confidence: {confidence:.2%}")
                return True
            else:
                logger.warning(f"⚠️  No rows updated for query {query_id}")
                return False
                
    except Exception as e:
        logger.error(f"❌ Error saving AI response to PostgreSQL: {str(e)}")
        return False
