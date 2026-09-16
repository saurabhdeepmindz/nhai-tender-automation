"""
LLM Utils Module - Shared Utilities for NHAI RAG System

Provides LLM interaction capabilities using multiple providers:
- OpenAI (GPT-4, GPT-3.5)
- Ollama (Local LLMs - Llama 3, Mistral, etc.)
- Anthropic Claude (future support)

Used by both History Retriever (Screen 7) and Chief Engineer (Screen 8) agents.

Author: NHAI Development Team
Date: January 2026
"""

import os
import json
from typing import List, Optional, Dict, Any, Union, Callable
from enum import Enum
import logging
import time
from datetime import datetime
import tiktoken

# Third-party imports
from langchain_openai import ChatOpenAI
from langchain_community.llms import Ollama
from langchain_core.language_models import BaseLLM
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage
from langchain_core.prompts import PromptTemplate, ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser, JsonOutputParser

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class LLMProvider(str, Enum):
    """Supported LLM providers"""
    OPENAI = "openai"
    OLLAMA = "ollama"
    ANTHROPIC = "anthropic"


class LLMModel(str, Enum):
    """Supported LLM models"""
    # OpenAI models
    GPT_4_TURBO = "gpt-4-turbo-preview"
    GPT_4 = "gpt-4"
    GPT_35_TURBO = "gpt-3.5-turbo"
    GPT_4O = "gpt-4o"
    GPT_4O_MINI = "gpt-4o-mini"
    
    # Ollama models
    LLAMA_3_8B = "llama3:8b"
    LLAMA_3_70B = "llama3:70b"
    MISTRAL_7B = "mistral:7b"
    MIXTRAL_8X7B = "mixtral:8x7b"
    CODELLAMA_13B = "codellama:13b"


class LLMConfig:
    """Configuration for LLM interactions"""
    
    def __init__(
        self,
        provider: LLMProvider = LLMProvider.OPENAI,
        model: Optional[str] = None,
        api_key: Optional[str] = None,
        base_url: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 2000,
        top_p: float = 1.0,
        frequency_penalty: float = 0.0,
        presence_penalty: float = 0.0,
        streaming: bool = False,
        timeout: int = 120,
        max_retries: int = 3,
        verbose: bool = False,
    ):
        self.provider = provider
        self.model = model or self._get_default_model(provider)
        self.api_key = api_key or os.getenv("OPENAI_API_KEY")
        self.base_url = base_url or os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
        self.temperature = temperature
        self.max_tokens = max_tokens
        self.top_p = top_p
        self.frequency_penalty = frequency_penalty
        self.presence_penalty = presence_penalty
        self.streaming = streaming
        self.timeout = timeout
        self.max_retries = max_retries
        self.verbose = verbose
    
    @staticmethod
    def _get_default_model(provider: LLMProvider) -> str:
        """Get default model for provider"""
        defaults = {
            LLMProvider.OPENAI: LLMModel.GPT_4O_MINI.value,
            LLMProvider.OLLAMA: LLMModel.LLAMA_3_8B.value,
            LLMProvider.ANTHROPIC: "claude-3-sonnet-20240229",
        }
        return defaults.get(provider, LLMModel.GPT_4O_MINI.value)


class LLMManager:
    """
    Main class for managing LLM interactions
    
    Features:
    - Multiple provider support (OpenAI, Ollama)
    - Automatic retry logic
    - Token counting and cost estimation
    - Prompt template management
    - Response parsing (text, JSON, structured)
    - Conversation history management
    
    Usage:
        config = LLMConfig(provider=LLMProvider.OPENAI)
        manager = LLMManager(config)
        response = manager.generate("What is EMD in tender context?")
    """
    
    def __init__(self, config: LLMConfig):
        self.config = config
        self.llm = self._initialize_llm()
        self.conversation_history: List[Dict[str, str]] = []
        
        # Initialize token encoder for OpenAI models
        self.token_encoder = None
        if config.provider == LLMProvider.OPENAI:
            try:
                self.token_encoder = tiktoken.encoding_for_model(config.model)
            except KeyError:
                self.token_encoder = tiktoken.get_encoding("cl100k_base")
        
        logger.info(
            f"Initialized LLMManager with provider={config.provider}, "
            f"model={config.model}"
        )
    
    def _initialize_llm(self) -> BaseLLM:
        """Initialize the appropriate LLM based on provider"""
        try:
            if self.config.provider == LLMProvider.OPENAI:
                return self._init_openai_llm()
            elif self.config.provider == LLMProvider.OLLAMA:
                return self._init_ollama_llm()
            else:
                raise ValueError(f"Unsupported provider: {self.config.provider}")
        except Exception as e:
            logger.error(f"Failed to initialize LLM: {str(e)}")
            raise
    
    def _init_openai_llm(self) -> ChatOpenAI:
        """Initialize OpenAI LLM"""
        if not self.config.api_key:
            raise ValueError("OpenAI API key is required. Set OPENAI_API_KEY environment variable.")
        
        return ChatOpenAI(
            model=self.config.model,
            openai_api_key=self.config.api_key,
            temperature=self.config.temperature,
            max_tokens=self.config.max_tokens,
            top_p=self.config.top_p,
            frequency_penalty=self.config.frequency_penalty,
            presence_penalty=self.config.presence_penalty,
            streaming=self.config.streaming,
            timeout=self.config.timeout,
            max_retries=self.config.max_retries,
            verbose=self.config.verbose,
        )
    
    def _init_ollama_llm(self) -> Ollama:
        """Initialize Ollama LLM"""
        return Ollama(
            model=self.config.model,
            base_url=self.config.base_url,
            temperature=self.config.temperature,
            num_predict=self.config.max_tokens,
            top_p=self.config.top_p,
        )
    
    def generate(
        self,
        prompt: str,
        system_message: Optional[str] = None,
        **kwargs
    ) -> str:
        """
        Generate a response from the LLM
        
        Args:
            prompt: User prompt/question
            system_message: Optional system message to set context
            **kwargs: Additional parameters to override config
            
        Returns:
            Generated response text
        """
        start_time = time.time()
        
        try:
            # Build messages
            messages = []
            if system_message:
                messages.append(SystemMessage(content=system_message))
            messages.append(HumanMessage(content=prompt))
            
            # Generate response
            if self.config.provider == LLMProvider.OPENAI:
                response = self.llm.invoke(messages)
                result = response.content
            else:
                # For Ollama, concatenate messages
                full_prompt = self._format_prompt(system_message, prompt)
                result = self.llm.invoke(full_prompt)
            
            # Track conversation
            self.conversation_history.append({
                "role": "user",
                "content": prompt,
                "timestamp": datetime.now().isoformat()
            })
            self.conversation_history.append({
                "role": "assistant",
                "content": result,
                "timestamp": datetime.now().isoformat()
            })
            
            duration = time.time() - start_time
            logger.info(f"Generated response in {duration:.2f}s")
            
            return result
            
        except Exception as e:
            logger.error(f"Failed to generate response: {str(e)}")
            raise
    
    def generate_with_context(
        self,
        prompt: str,
        context: str,
        system_message: Optional[str] = None,
    ) -> str:
        """
        Generate response with additional context
        
        Args:
            prompt: User query
            context: Additional context (e.g., retrieved documents)
            system_message: Optional system message
            
        Returns:
            Generated response
        """
        enhanced_prompt = f"""Context:
{context}

Question: {prompt}

Please provide a detailed answer based on the context provided above."""
        
        return self.generate(enhanced_prompt, system_message)
    
    def generate_json(
        self,
        prompt: str,
        system_message: Optional[str] = None,
        schema: Optional[Dict] = None,
    ) -> Dict[str, Any]:
        """
        Generate JSON response from LLM
        
        Args:
            prompt: User prompt
            system_message: Optional system message
            schema: Optional JSON schema for validation
            
        Returns:
            Parsed JSON response
        """
        # Add JSON instruction to prompt
        json_prompt = f"""{prompt}

Please provide your response as a valid JSON object."""
        
        if schema:
            json_prompt += f"\n\nFollow this schema:\n{json.dumps(schema, indent=2)}"
        
        response = self.generate(json_prompt, system_message)
        
        # Parse JSON
        try:
            # Extract JSON if wrapped in markdown code blocks
            if "```json" in response:
                json_str = response.split("```json")[1].split("```")[0].strip()
            elif "```" in response:
                json_str = response.split("```")[1].split("```")[0].strip()
            else:
                json_str = response
            
            result = json.loads(json_str)
            return result
            
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse JSON response: {str(e)}")
            logger.debug(f"Response was: {response}")
            raise ValueError(f"Invalid JSON response: {str(e)}")
    
    def generate_structured(
        self,
        prompt: str,
        output_schema: Dict[str, Any],
        system_message: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Generate structured output based on schema
        
        Args:
            prompt: User prompt
            output_schema: Expected output structure
            system_message: Optional system message
            
        Returns:
            Structured data matching schema
        """
        return self.generate_json(prompt, system_message, output_schema)
    
    def chat(
        self,
        message: str,
        use_history: bool = True,
        max_history: int = 10,
    ) -> str:
        """
        Continue a conversation with context from history
        
        Args:
            message: User message
            use_history: Whether to use conversation history
            max_history: Maximum number of history messages to include
            
        Returns:
            Assistant response
        """
        messages = []
        
        if use_history and self.conversation_history:
            # Include recent history
            recent_history = self.conversation_history[-max_history:]
            for msg in recent_history:
                if msg["role"] == "user":
                    messages.append(HumanMessage(content=msg["content"]))
                elif msg["role"] == "assistant":
                    messages.append(AIMessage(content=msg["content"]))
        
        messages.append(HumanMessage(content=message))
        
        # Generate response
        if self.config.provider == LLMProvider.OPENAI:
            response = self.llm.invoke(messages)
            result = response.content
        else:
            # For Ollama, format with history
            full_prompt = self._format_chat_history(recent_history if use_history else [], message)
            result = self.llm.invoke(full_prompt)
        
        # Update history
        self.conversation_history.append({
            "role": "user",
            "content": message,
            "timestamp": datetime.now().isoformat()
        })
        self.conversation_history.append({
            "role": "assistant",
            "content": result,
            "timestamp": datetime.now().isoformat()
        })
        
        return result
    
    def _format_prompt(self, system_message: Optional[str], user_message: str) -> str:
        """Format prompt for non-chat models"""
        if system_message:
            return f"{system_message}\n\n{user_message}"
        return user_message
    
    def _format_chat_history(self, history: List[Dict], current_message: str) -> str:
        """Format chat history for Ollama"""
        formatted = []
        for msg in history:
            role = "User" if msg["role"] == "user" else "Assistant"
            formatted.append(f"{role}: {msg['content']}")
        formatted.append(f"User: {current_message}")
        formatted.append("Assistant:")
        return "\n\n".join(formatted)
    
    def count_tokens(self, text: str) -> int:
        """
        Count tokens in text
        
        Args:
            text: Text to count tokens for
            
        Returns:
            Number of tokens
        """
        if self.token_encoder:
            return len(self.token_encoder.encode(text))
        else:
            # Rough estimate for non-OpenAI models (4 chars ≈ 1 token)
            return len(text) // 4
    
    def estimate_cost(
        self,
        input_tokens: int,
        output_tokens: int
    ) -> float:
        """
        Estimate cost for OpenAI API call
        
        Args:
            input_tokens: Number of input tokens
            output_tokens: Number of output tokens
            
        Returns:
            Estimated cost in USD
        """
        # Pricing as of Jan 2024 (update as needed)
        pricing = {
            "gpt-4": {"input": 0.03, "output": 0.06},
            "gpt-4-turbo-preview": {"input": 0.01, "output": 0.03},
            "gpt-3.5-turbo": {"input": 0.0005, "output": 0.0015},
            "gpt-4o": {"input": 0.005, "output": 0.015},
            "gpt-4o-mini": {"input": 0.00015, "output": 0.0006},
        }
        
        model_pricing = pricing.get(self.config.model, {"input": 0.001, "output": 0.002})
        
        input_cost = (input_tokens / 1000) * model_pricing["input"]
        output_cost = (output_tokens / 1000) * model_pricing["output"]
        
        return input_cost + output_cost
    
    def clear_history(self):
        """Clear conversation history"""
        self.conversation_history = []
        logger.info("Conversation history cleared")
    
    def get_history(self) -> List[Dict[str, str]]:
        """Get conversation history"""
        return self.conversation_history.copy()
    
    def save_history(self, filepath: str):
        """Save conversation history to file"""
        with open(filepath, 'w') as f:
            json.dump(self.conversation_history, f, indent=2)
        logger.info(f"Conversation history saved to {filepath}")
    
    def load_history(self, filepath: str):
        """Load conversation history from file"""
        with open(filepath, 'r') as f:
            self.conversation_history = json.load(f)
        logger.info(f"Conversation history loaded from {filepath}")


class PromptTemplateManager:
    """
    Manages reusable prompt templates for common tasks
    """
    
    # Common templates for NHAI tender system
    TEMPLATES = {
        "query_analysis": """You are an expert in analyzing tender queries.
Given the following query, identify:
1. The query category (technical, commercial, eligibility, contractual)
2. Key intent/purpose
3. Required information to answer

Query: {query}

Provide your analysis as a JSON object with keys: category, intent, required_info""",
        
        "answer_generation": """You are an expert in tender documentation and procurement processes.

Context from historical data:
{context}

Vendor Query: {query}

Based on the context provided, generate a professional response to the vendor's query. 
Your response should be:
- Accurate and based on the context
- Clear and professional
- Specific with references to relevant clauses/sections
- Complete and addressing all aspects of the query

Response:""",
        
        "document_summarization": """Summarize the following tender document, highlighting:
1. Key requirements
2. Important deadlines
3. Critical clauses
4. Eligibility criteria

Document:
{document}

Summary:""",
        
        "compliance_check": """Review the following RFP section for compliance with standard templates.
Identify any:
1. Missing clauses
2. Ambiguous language
3. Conflicts with standard terms
4. Potential issues for bidders

RFP Section:
{rfp_section}

Standard Template Reference:
{template}

Compliance Analysis:""",
        
        "corrigendum_generation": """Based on the following identified issues in the RFP, generate a professional corrigendum.

Issues Identified:
{issues}

Original RFP Sections:
{original_sections}

Generate a corrigendum with:
1. Clear reference to affected clauses
2. Precise amendments
3. Professional language
4. Proper formatting

Corrigendum:""",
    }
    
    @classmethod
    def get_template(cls, template_name: str) -> PromptTemplate:
        """Get a prompt template by name"""
        if template_name not in cls.TEMPLATES:
            raise ValueError(f"Template '{template_name}' not found")
        
        template_str = cls.TEMPLATES[template_name]
        return PromptTemplate.from_template(template_str)
    
    @classmethod
    def format_template(cls, template_name: str, **kwargs) -> str:
        """Format a template with variables"""
        template = cls.get_template(template_name)
        return template.format(**kwargs)


def create_llm_manager(
    provider: str = "openai",
    model: Optional[str] = None,
    **kwargs
) -> LLMManager:
    """
    Factory function to create LLM manager
    
    Args:
        provider: Provider name (openai, ollama)
        model: Optional model name
        **kwargs: Additional configuration options
        
    Returns:
        LLMManager instance
        
    Example:
        manager = create_llm_manager(
            provider="openai",
            model="gpt-4o-mini",
            temperature=0.7
        )
    """
    provider_enum = LLMProvider(provider.lower())
    
    config = LLMConfig(
        provider=provider_enum,
        model=model,
        **kwargs
    )
    
    return LLMManager(config)


# Convenience functions
def ask_llm(
    question: str,
    provider: str = "openai",
    model: Optional[str] = None,
    temperature: float = 0.7,
) -> str:
    """
    Quick function to ask LLM a question
    
    Args:
        question: Question to ask
        provider: LLM provider
        model: Optional model name
        temperature: Sampling temperature
        
    Returns:
        LLM response
    """
    manager = create_llm_manager(
        provider=provider,
        model=model,
        temperature=temperature
    )
    return manager.generate(question)


def extract_json_from_llm(
    prompt: str,
    schema: Optional[Dict] = None,
    provider: str = "openai",
    model: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Quick function to get JSON response from LLM
    
    Args:
        prompt: Prompt for LLM
        schema: Optional JSON schema
        provider: LLM provider
        model: Optional model name
        
    Returns:
        Parsed JSON response
    """
    manager = create_llm_manager(provider=provider, model=model)
    return manager.generate_json(prompt, schema=schema)


if __name__ == "__main__":
    # Example usage and testing
    print("Testing LLM Manager...")
    
    try:
        # Test with OpenAI
        config = LLMConfig(
            provider=LLMProvider.OPENAI,
            model=LLMModel.GPT_4O_MINI.value,
            temperature=0.7,
            max_tokens=500
        )
        manager = LLMManager(config)
        
        # Test basic generation
        response = manager.generate(
            "What is EMD in the context of tenders? Answer briefly.",
            system_message="You are a procurement expert."
        )
        print(f"✓ Basic generation:\n{response[:200]}...\n")
        
        # Test token counting
        tokens = manager.count_tokens(response)
        print(f"✓ Token count: {tokens}")
        
        # Test JSON generation
        json_response = manager.generate_json(
            "List 3 key requirements for highway tender bidders",
            schema={
                "requirements": ["string"]
            }
        )
        print(f"✓ JSON generation:\n{json.dumps(json_response, indent=2)}\n")
        
        # Test conversation
        response1 = manager.chat("What is a corrigendum?")
        response2 = manager.chat("When should it be issued?")
        print(f"✓ Conversation history: {len(manager.get_history())} messages")
        
        # Test template
        template_prompt = PromptTemplateManager.format_template(
            "query_analysis",
            query="What is the minimum EMD amount?"
        )
        print(f"✓ Template formatted:\n{template_prompt[:200]}...\n")
        
        print("\n✅ All tests passed!")
        
    except Exception as e:
        print(f"❌ Test failed: {str(e)}")
