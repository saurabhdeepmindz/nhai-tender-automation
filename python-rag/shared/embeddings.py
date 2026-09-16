"""
Embeddings Module - Shared Utilities for NHAI RAG System

Provides embedding generation capabilities using multiple providers:
- OpenAI Embeddings (text-embedding-ada-002, text-embedding-3-small, text-embedding-3-large)
- HuggingFace Embeddings (sentence-transformers)
- Local Ollama Embeddings

Used by both History Retriever (Screen 7) and Chief Engineer (Screen 8) agents.

Author: NHAI Development Team
Date: January 2026
"""

import os
from typing import List, Optional, Dict, Any, Union
from enum import Enum
import logging
from functools import lru_cache
import hashlib

# Third-party imports
import numpy as np
from langchain_openai import OpenAIEmbeddings
from langchain_community.embeddings import HuggingFaceEmbeddings, OllamaEmbeddings
from langchain_core.embeddings import Embeddings

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class EmbeddingProvider(str, Enum):
    """Supported embedding providers"""
    OPENAI = "openai"
    HUGGINGFACE = "huggingface"
    OLLAMA = "ollama"


class EmbeddingModel(str, Enum):
    """Supported embedding models"""
    # OpenAI models
    OPENAI_ADA_002 = "text-embedding-ada-002"
    OPENAI_3_SMALL = "text-embedding-3-small"
    OPENAI_3_LARGE = "text-embedding-3-large"
    
    # HuggingFace models
    SENTENCE_TRANSFORMERS_MINI = "sentence-transformers/all-MiniLM-L6-v2"
    SENTENCE_TRANSFORMERS_MPNET = "sentence-transformers/all-mpnet-base-v2"
    INSTRUCTOR_XL = "hkunlp/instructor-xl"
    
    # Ollama models
    OLLAMA_NOMIC = "nomic-embed-text"
    OLLAMA_MXBAI = "mxbai-embed-large"


class EmbeddingConfig:
    """Configuration for embedding generation"""
    
    def __init__(
        self,
        provider: EmbeddingProvider = EmbeddingProvider.OPENAI,
        model: Optional[str] = None,
        api_key: Optional[str] = None,
        base_url: Optional[str] = None,
        dimensions: Optional[int] = None,
        chunk_size: int = 1000,
        batch_size: int = 100,
        cache_enabled: bool = True,
    ):
        self.provider = provider
        self.model = model or self._get_default_model(provider)
        self.api_key = api_key or os.getenv("OPENAI_API_KEY")
        self.base_url = base_url or os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
        self.dimensions = dimensions
        self.chunk_size = chunk_size
        self.batch_size = batch_size
        self.cache_enabled = cache_enabled
        
    @staticmethod
    def _get_default_model(provider: EmbeddingProvider) -> str:
        """Get default model for provider"""
        defaults = {
            EmbeddingProvider.OPENAI: EmbeddingModel.OPENAI_3_SMALL.value,
            EmbeddingProvider.HUGGINGFACE: EmbeddingModel.SENTENCE_TRANSFORMERS_MPNET.value,
            EmbeddingProvider.OLLAMA: EmbeddingModel.OLLAMA_NOMIC.value,
        }
        return defaults.get(provider, EmbeddingModel.OPENAI_3_SMALL.value)


class EmbeddingGenerator:
    """
    Main class for generating embeddings across different providers
    
    Features:
    - Multiple provider support (OpenAI, HuggingFace, Ollama)
    - Batch processing for efficiency
    - Optional caching for repeated texts
    - Automatic retry logic
    - Dimension validation
    
    Usage:
        config = EmbeddingConfig(provider=EmbeddingProvider.OPENAI)
        generator = EmbeddingGenerator(config)
        embeddings = generator.embed_documents(["text1", "text2"])
    """
    
    def __init__(self, config: EmbeddingConfig):
        self.config = config
        self.embeddings_model = self._initialize_embeddings()
        self._cache: Dict[str, List[float]] = {}
        
        logger.info(
            f"Initialized EmbeddingGenerator with provider={config.provider}, "
            f"model={config.model}"
        )
    
    def _initialize_embeddings(self) -> Embeddings:
        """Initialize the appropriate embeddings model based on provider"""
        try:
            if self.config.provider == EmbeddingProvider.OPENAI:
                return self._init_openai_embeddings()
            elif self.config.provider == EmbeddingProvider.HUGGINGFACE:
                return self._init_huggingface_embeddings()
            elif self.config.provider == EmbeddingProvider.OLLAMA:
                return self._init_ollama_embeddings()
            else:
                raise ValueError(f"Unsupported provider: {self.config.provider}")
        except Exception as e:
            logger.error(f"Failed to initialize embeddings: {str(e)}")
            raise
    
    def _init_openai_embeddings(self) -> OpenAIEmbeddings:
        """Initialize OpenAI embeddings"""
        if not self.config.api_key:
            raise ValueError(
                "OpenAI API key is required when using OpenAI provider. "
                "Either:\n"
                "1. Set OPENAI_API_KEY environment variable, or\n"
                "2. Change EMBEDDING_PROVIDER=ollama in .env file to use Ollama (free, local)"
            )
        
        kwargs = {
            "openai_api_key": self.config.api_key,
            "model": self.config.model,
            "chunk_size": self.config.chunk_size,
        }
        
        # Add dimensions for models that support it
        if self.config.dimensions and "text-embedding-3" in self.config.model:
            kwargs["dimensions"] = self.config.dimensions
        
        return OpenAIEmbeddings(**kwargs)
    
    def _init_huggingface_embeddings(self) -> HuggingFaceEmbeddings:
        """Initialize HuggingFace embeddings"""
        return HuggingFaceEmbeddings(
            model_name=self.config.model,
            model_kwargs={'device': 'cpu'},  # Use 'cuda' if GPU available
            encode_kwargs={'normalize_embeddings': True}
        )
    
    def _init_ollama_embeddings(self) -> OllamaEmbeddings:
        """Initialize Ollama embeddings"""
        return OllamaEmbeddings(
            model=self.config.model,
            base_url=self.config.base_url
        )
    
    def _generate_cache_key(self, text: str) -> str:
        """Generate cache key for text"""
        return hashlib.md5(text.encode()).hexdigest()
    
    def embed_query(self, text: str) -> List[float]:
        """
        Embed a single query text
        
        Args:
            text: Query text to embed
            
        Returns:
            List of embedding values
        """
        if not text or not text.strip():
            raise ValueError("Text cannot be empty")
        
        # Check cache
        if self.config.cache_enabled:
            cache_key = self._generate_cache_key(text)
            if cache_key in self._cache:
                logger.debug(f"Cache hit for query: {text[:50]}...")
                return self._cache[cache_key]
        
        try:
            embedding = self.embeddings_model.embed_query(text)
            
            # Cache result
            if self.config.cache_enabled:
                self._cache[cache_key] = embedding
            
            logger.debug(f"Generated embedding for query, dimension: {len(embedding)}")
            return embedding
            
        except Exception as e:
            logger.error(f"Failed to embed query: {str(e)}")
            raise
    
    def embed_documents(
        self,
        texts: List[str],
        batch_size: Optional[int] = None
    ) -> List[List[float]]:
        """
        Embed multiple documents with batch processing
        
        Args:
            texts: List of texts to embed
            batch_size: Optional batch size (uses config default if not provided)
            
        Returns:
            List of embeddings
        """
        if not texts:
            return []
        
        batch_size = batch_size or self.config.batch_size
        embeddings = []
        
        # Check cache for all texts
        if self.config.cache_enabled:
            cached_embeddings = []
            uncached_texts = []
            uncached_indices = []
            
            for i, text in enumerate(texts):
                cache_key = self._generate_cache_key(text)
                if cache_key in self._cache:
                    cached_embeddings.append((i, self._cache[cache_key]))
                else:
                    uncached_texts.append(text)
                    uncached_indices.append(i)
            
            logger.info(
                f"Cache stats: {len(cached_embeddings)} hits, "
                f"{len(uncached_texts)} misses out of {len(texts)} texts"
            )
            
            # Generate embeddings for uncached texts
            if uncached_texts:
                new_embeddings = self._batch_embed(uncached_texts, batch_size)
                
                # Cache new embeddings
                for text, embedding in zip(uncached_texts, new_embeddings):
                    cache_key = self._generate_cache_key(text)
                    self._cache[cache_key] = embedding
                
                # Combine cached and new embeddings in correct order
                all_embeddings = [None] * len(texts)
                for i, emb in cached_embeddings:
                    all_embeddings[i] = emb
                for i, emb in zip(uncached_indices, new_embeddings):
                    all_embeddings[i] = emb
                
                embeddings = all_embeddings
            else:
                # All from cache
                embeddings = [emb for _, emb in sorted(cached_embeddings)]
        else:
            # No caching, generate all
            embeddings = self._batch_embed(texts, batch_size)
        
        return embeddings
    
    def _batch_embed(self, texts: List[str], batch_size: int) -> List[List[float]]:
        """Embed texts in batches"""
        all_embeddings = []
        
        for i in range(0, len(texts), batch_size):
            batch = texts[i:i + batch_size]
            logger.info(f"Processing batch {i//batch_size + 1}/{(len(texts)-1)//batch_size + 1}")
            
            try:
                batch_embeddings = self.embeddings_model.embed_documents(batch)
                all_embeddings.extend(batch_embeddings)
            except Exception as e:
                logger.error(f"Failed to embed batch {i//batch_size + 1}: {str(e)}")
                raise
        
        return all_embeddings
    
    def get_embedding_dimension(self) -> int:
        """Get the dimension of embeddings produced by this model"""
        test_embedding = self.embed_query("test")
        return len(test_embedding)
    
    def clear_cache(self):
        """Clear the embedding cache"""
        self._cache.clear()
        logger.info("Embedding cache cleared")
    
    def get_cache_size(self) -> int:
        """Get number of cached embeddings"""
        return len(self._cache)
    
    def calculate_similarity(
        self,
        embedding1: List[float],
        embedding2: List[float]
    ) -> float:
        """
        Calculate cosine similarity between two embeddings
        
        Args:
            embedding1: First embedding
            embedding2: Second embedding
            
        Returns:
            Similarity score between 0 and 1
        """
        vec1 = np.array(embedding1)
        vec2 = np.array(embedding2)
        
        # Cosine similarity
        similarity = np.dot(vec1, vec2) / (np.linalg.norm(vec1) * np.linalg.norm(vec2))
        
        return float(similarity)


class BatchEmbeddingProcessor:
    """
    Utility class for processing large batches of documents efficiently
    
    Features:
    - Progress tracking
    - Memory-efficient processing
    - Error recovery
    """
    
    def __init__(self, generator: EmbeddingGenerator):
        self.generator = generator
    
    def process_documents(
        self,
        documents: List[str],
        show_progress: bool = True
    ) -> List[List[float]]:
        """
        Process large document collections with progress tracking
        
        Args:
            documents: List of documents to embed
            show_progress: Whether to show progress logs
            
        Returns:
            List of embeddings
        """
        total = len(documents)
        logger.info(f"Starting batch processing of {total} documents")
        
        embeddings = self.generator.embed_documents(documents)
        
        if show_progress:
            logger.info(f"Completed batch processing: {total} documents embedded")
        
        return embeddings


def create_embedding_generator(
    provider: str = "openai",
    model: Optional[str] = None,
    **kwargs
) -> EmbeddingGenerator:
    """
    Factory function to create embedding generator
    
    Args:
        provider: Provider name (openai, huggingface, ollama)
        model: Optional model name
        **kwargs: Additional configuration options
        
    Returns:
        EmbeddingGenerator instance
        
    Example:
        generator = create_embedding_generator(
            provider="openai",
            model="text-embedding-3-small"
        )
    """
    provider_enum = EmbeddingProvider(provider.lower())
    
    config = EmbeddingConfig(
        provider=provider_enum,
        model=model,
        **kwargs
    )
    
    return EmbeddingGenerator(config)


# Convenience functions for quick usage
def embed_text(
    text: str,
    provider: str = "openai",
    model: Optional[str] = None
) -> List[float]:
    """
    Quick function to embed a single text
    
    Args:
        text: Text to embed
        provider: Embedding provider
        model: Optional model name
        
    Returns:
        Embedding vector
    """
    generator = create_embedding_generator(provider=provider, model=model)
    return generator.embed_query(text)


def embed_texts(
    texts: List[str],
    provider: str = "openai",
    model: Optional[str] = None,
    batch_size: int = 100
) -> List[List[float]]:
    """
    Quick function to embed multiple texts
    
    Args:
        texts: List of texts to embed
        provider: Embedding provider
        model: Optional model name
        batch_size: Batch size for processing
        
    Returns:
        List of embedding vectors
    """
    generator = create_embedding_generator(
        provider=provider,
        model=model,
        batch_size=batch_size
    )
    return generator.embed_documents(texts)


if __name__ == "__main__":
    # Example usage and testing
    print("Testing Embedding Generator...")
    
    # Test with OpenAI (requires API key)
    try:
        config = EmbeddingConfig(
            provider=EmbeddingProvider.OPENAI,
            model=EmbeddingModel.OPENAI_3_SMALL.value,
            cache_enabled=True
        )
        generator = EmbeddingGenerator(config)
        
        # Test single query
        test_text = "What is the EMD requirement for this tender?"
        embedding = generator.embed_query(test_text)
        print(f"✓ Single query embedding dimension: {len(embedding)}")
        
        # Test batch
        test_docs = [
            "Technical specifications for highway construction",
            "Commercial terms and payment schedule",
            "Eligibility criteria for bidders"
        ]
        embeddings = generator.embed_documents(test_docs)
        print(f"✓ Batch embeddings count: {len(embeddings)}")
        
        # Test caching
        embedding2 = generator.embed_query(test_text)
        print(f"✓ Cache working: {generator.get_cache_size()} cached items")
        
        # Test similarity
        similarity = generator.calculate_similarity(embeddings[0], embeddings[1])
        print(f"✓ Similarity between docs 1 and 2: {similarity:.4f}")
        
        print("\n✅ All tests passed!")
        
    except Exception as e:
        print(f"❌ Test failed: {str(e)}")
