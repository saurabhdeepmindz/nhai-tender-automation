"""
Screen 7: Configuration Manager
NHAI AI-Driven Tender Query Automation System

Manages RAG configuration including:
- Chunk size and overlap
- Embedding model selection
- Vector store settings
- Search parameters

Author: NHAI Development Team
Version: 1.0.0
"""

import os
import json
import logging
from typing import Dict, Any, Optional
from pathlib import Path

logger = logging.getLogger(__name__)

class ConfigManager:
    """
    Configuration Manager for History Retriever Agent
    
    Handles loading, saving, and updating RAG configuration.
    Configuration can be updated via API and takes effect immediately.
    """
    
    DEFAULT_CONFIG = {
        # Text Processing
        "chunk_size": 1000,
        "chunk_overlap": 200,
        "max_chunk_size": 2000,
        "min_chunk_size": 100,
        
        # Models
        "embedding_model": "gemma:2b",
        "llm_model": "llama2",
        "ollama_base_url": "http://localhost:11434",
        
        # Vector Store
        "vector_store_path": "./chroma_db",
        "collection_name": "nhai_historical_data",
        
        # Search Parameters
        "default_top_k": 5,
        "max_top_k": 20,
        "min_similarity_score": 0.5,
        "reranking_enabled": False,
        
        # Performance
        "batch_size": 10,
        "max_concurrent_requests": 5,
        
        # Logging
        "log_level": "INFO",
        "log_file": "history_retriever.log"
    }
    
    def __init__(self, config_file: str = "config.json"):
        """
        Initialize Configuration Manager
        
        Args:
            config_file: Path to configuration file
        """
        self.config_file = config_file
        self.config = self.DEFAULT_CONFIG.copy()
        self._load_config()
        
        logger.info("Configuration Manager initialized")
    
    def _load_config(self):
        """Load configuration from file if exists"""
        try:
            config_path = Path(self.config_file)
            
            if config_path.exists():
                with open(config_path, 'r') as f:
                    loaded_config = json.load(f)
                    self.config.update(loaded_config)
                logger.info(f"Configuration loaded from {self.config_file}")
            else:
                # Create default config file
                self._save_config()
                logger.info(f"Created default configuration file: {self.config_file}")
                
        except Exception as e:
            logger.warning(f"Failed to load config, using defaults: {str(e)}")
    
    def _save_config(self):
        """Save current configuration to file"""
        try:
            with open(self.config_file, 'w') as f:
                json.dump(self.config, f, indent=2)
            logger.info(f"Configuration saved to {self.config_file}")
        except Exception as e:
            logger.error(f"Failed to save config: {str(e)}")
    
    def get(self, key: str, default: Any = None) -> Any:
        """
        Get configuration value
        
        Args:
            key: Configuration key
            default: Default value if key not found
            
        Returns:
            Configuration value
        """
        return self.config.get(key, default)
    
    def get_config(self) -> Dict[str, Any]:
        """Get complete configuration"""
        return self.config.copy()
    
    def update_config(self, updates: Dict[str, Any]) -> bool:
        """
        Update configuration
        
        Args:
            updates: Dictionary of configuration updates
            
        Returns:
            True if successful
        """
        try:
            # Validate updates
            valid_updates = self._validate_updates(updates)
            
            if not valid_updates:
                logger.warning("No valid updates provided")
                return False
            
            # Apply updates
            self.config.update(valid_updates)
            
            # Save to file
            self._save_config()
            
            logger.info(f"Configuration updated: {list(valid_updates.keys())}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to update config: {str(e)}")
            return False
    
    def _validate_updates(self, updates: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validate configuration updates
        
        Args:
            updates: Proposed configuration updates
            
        Returns:
            Dictionary of valid updates
        """
        valid_updates = {}
        
        for key, value in updates.items():
            if key not in self.DEFAULT_CONFIG:
                logger.warning(f"Unknown config key: {key}")
                continue
            
            # Validate specific parameters
            if key == "chunk_size":
                if isinstance(value, int) and 100 <= value <= 5000:
                    valid_updates[key] = value
                else:
                    logger.warning(f"Invalid chunk_size: {value} (must be 100-5000)")
                    
            elif key == "chunk_overlap":
                if isinstance(value, int) and 0 <= value <= 1000:
                    valid_updates[key] = value
                else:
                    logger.warning(f"Invalid chunk_overlap: {value} (must be 0-1000)")
                    
            elif key == "default_top_k":
                if isinstance(value, int) and 1 <= value <= 50:
                    valid_updates[key] = value
                else:
                    logger.warning(f"Invalid default_top_k: {value} (must be 1-50)")
                    
            elif key == "min_similarity_score":
                if isinstance(value, (int, float)) and 0.0 <= value <= 1.0:
                    valid_updates[key] = float(value)
                else:
                    logger.warning(f"Invalid min_similarity_score: {value} (must be 0.0-1.0)")
                    
            elif key in ["embedding_model", "llm_model", "vector_store_path", "collection_name"]:
                if isinstance(value, str) and value.strip():
                    valid_updates[key] = value.strip()
                else:
                    logger.warning(f"Invalid {key}: {value}")
                    
            elif key in ["reranking_enabled"]:
                if isinstance(value, bool):
                    valid_updates[key] = value
                else:
                    logger.warning(f"Invalid {key}: {value} (must be boolean)")
                    
            else:
                # For other keys, accept the value as-is
                valid_updates[key] = value
        
        return valid_updates
    
    def reset_to_defaults(self):
        """Reset configuration to defaults"""
        try:
            self.config = self.DEFAULT_CONFIG.copy()
            self._save_config()
            logger.info("Configuration reset to defaults")
        except Exception as e:
            logger.error(f"Failed to reset config: {str(e)}")
    
    def get_model_config(self) -> Dict[str, str]:
        """Get model-specific configuration"""
        return {
            "embedding_model": self.config.get("embedding_model"),
            "llm_model": self.config.get("llm_model"),
            "ollama_base_url": self.config.get("ollama_base_url")
        }
    
    def get_chunking_config(self) -> Dict[str, int]:
        """Get text chunking configuration"""
        return {
            "chunk_size": self.config.get("chunk_size"),
            "chunk_overlap": self.config.get("chunk_overlap"),
            "max_chunk_size": self.config.get("max_chunk_size"),
            "min_chunk_size": self.config.get("min_chunk_size")
        }
    
    def get_search_config(self) -> Dict[str, Any]:
        """Get search configuration"""
        return {
            "default_top_k": self.config.get("default_top_k"),
            "max_top_k": self.config.get("max_top_k"),
            "min_similarity_score": self.config.get("min_similarity_score"),
            "reranking_enabled": self.config.get("reranking_enabled")
        }
    
    def __repr__(self) -> str:
        """String representation of configuration"""
        return f"ConfigManager(file='{self.config_file}', keys={len(self.config)})"
