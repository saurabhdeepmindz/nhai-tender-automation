"""
NHAI RAG System - Shared Utilities Package

This package provides common utilities for the NHAI AI-Driven Tender Query Automation System.
Used by both Screen 7 (History Retriever) and Screen 8 (Chief Engineer) agents.

Modules:
- embeddings: Embedding generation for vectorization
- llm_utils: LLM interaction and prompt management

Author: NHAI Development Team
Date: January 2026
Version: 1.0.0
"""

from .embeddings import (
    EmbeddingProvider,
    EmbeddingModel,
    EmbeddingConfig,
    EmbeddingGenerator,
    BatchEmbeddingProcessor,
    create_embedding_generator,
    embed_text,
    embed_texts,
)

from .llm_utils import (
    LLMProvider,
    LLMModel,
    LLMConfig,
    LLMManager,
    PromptTemplateManager,
    create_llm_manager,
    ask_llm,
    extract_json_from_llm,
)

__version__ = "1.0.0"
__author__ = "NHAI Development Team"

__all__ = [
    # Embedding exports
    "EmbeddingProvider",
    "EmbeddingModel",
    "EmbeddingConfig",
    "EmbeddingGenerator",
    "BatchEmbeddingProcessor",
    "create_embedding_generator",
    "embed_text",
    "embed_texts",
    # LLM exports
    "LLMProvider",
    "LLMModel",
    "LLMConfig",
    "LLMManager",
    "PromptTemplateManager",
    "create_llm_manager",
    "ask_llm",
    "extract_json_from_llm",
]
