"""
Screen 8: PostgreSQL Database Configuration
NHAI AI-Driven Tender Query Automation System

Provides PostgreSQL connection pool and database utilities for
workflow tracking with asyncpg.

Author: NHAI Development Team
Version: 1.0.0
"""

import os
import logging
from typing import Optional
import asyncpg
from asyncpg.pool import Pool

logger = logging.getLogger(__name__)

class DatabaseConfig:
    """PostgreSQL Database Configuration and Connection Pool Manager"""
    
    def __init__(self):
        """Initialize database configuration from environment variables"""
        self.host = os.getenv("POSTGRES_HOST", "localhost")
        self.port = int(os.getenv("POSTGRES_PORT", "5432"))
        self.database = os.getenv("POSTGRES_DB", "nhai_tender_db")
        self.user = os.getenv("POSTGRES_USER", "postgres")
        self.password = os.getenv("POSTGRES_PASSWORD", "root")
        
        # Connection pool settings
        self.min_pool_size = int(os.getenv("POSTGRES_MIN_POOL_SIZE", "5"))
        self.max_pool_size = int(os.getenv("POSTGRES_MAX_POOL_SIZE", "20"))
        self.pool_timeout = int(os.getenv("POSTGRES_POOL_TIMEOUT", "30"))
        
        self.pool: Optional[Pool] = None
        
        logger.info(f"Database config initialized: {self.host}:{self.port}/{self.database}")
    
    async def create_pool(self) -> Pool:
        """
        Create and return asyncpg connection pool
        
        Returns:
            Connection pool instance
        """
        if self.pool is not None:
            logger.warning("Connection pool already exists")
            return self.pool
        
        try:
            self.pool = await asyncpg.create_pool(
                host=self.host,
                port=self.port,
                database=self.database,
                user=self.user,
                password=self.password,
                min_size=self.min_pool_size,
                max_size=self.max_pool_size,
                command_timeout=self.pool_timeout,
            )
            
            logger.info(f"PostgreSQL connection pool created (min={self.min_pool_size}, max={self.max_pool_size})")
            
            # Test connection
            async with self.pool.acquire() as conn:
                version = await conn.fetchval("SELECT version()")
                logger.info(f"PostgreSQL connected: {version}")
            
            return self.pool
            
        except Exception as e:
            logger.error(f"Failed to create connection pool: {str(e)}")
            raise
    
    async def close_pool(self):
        """Close connection pool"""
        if self.pool:
            await self.pool.close()
            logger.info("PostgreSQL connection pool closed")
            self.pool = None
    
    def get_pool(self) -> Optional[Pool]:
        """Get existing connection pool"""
        return self.pool
    
    async def health_check(self) -> bool:
        """
        Check database health
        
        Returns:
            True if database is accessible, False otherwise
        """
        try:
            if not self.pool:
                return False
            
            async with self.pool.acquire() as conn:
                await conn.fetchval("SELECT 1")
            
            return True
            
        except Exception as e:
            logger.error(f"Database health check failed: {str(e)}")
            return False
    
    def get_connection_string(self) -> str:
        """Get PostgreSQL connection string (for debugging)"""
        return f"postgresql://{self.user}:***@{self.host}:{self.port}/{self.database}"


# Global database config instance
db_config = DatabaseConfig()


async def init_database():
    """
    Initialize database connection pool
    
    Call this at application startup
    """
    await db_config.create_pool()


async def close_database():
    """
    Close database connection pool
    
    Call this at application shutdown
    """
    await db_config.close_pool()


def get_database() -> Optional[Pool]:
    """
    Get database connection pool
    
    Returns:
        Connection pool instance or None if not initialized
    """
    return db_config.get_pool()
