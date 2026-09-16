# 🛠️ NHAI RAG System - Shared Utilities

**Shared Python utilities for the NHAI AI-Driven Tender Query Automation System**

This package provides common functionality used by both:
- **Screen 7:** History Retriever Agent (Port 8000)
- **Screen 8:** Chief Engineer Agent (Port 8001)

---

## 📦 **Package Contents**

```
shared/
├── __init__.py              # Package initialization
├── embeddings.py            # Embedding generation utilities
├── llm_utils.py             # LLM interaction utilities
├── requirements.txt         # Python dependencies
└── README.md               # This file
```

---

## 🎯 **Features**

### **embeddings.py**
- ✅ Multiple embedding providers (OpenAI, HuggingFace, Ollama)
- ✅ Batch processing with progress tracking
- ✅ Automatic caching for efficiency
- ✅ Similarity calculation
- ✅ Configurable dimensions and chunk sizes
- ✅ Memory-efficient processing

### **llm_utils.py**
- ✅ Multiple LLM providers (OpenAI, Ollama)
- ✅ Chat and completion modes
- ✅ JSON/structured output parsing
- ✅ Conversation history management
- ✅ Token counting and cost estimation
- ✅ Reusable prompt templates
- ✅ Automatic retry logic

---

## 🚀 **Quick Start**

### **Installation**

```bash
# Navigate to shared folder
cd python-rag/shared

# Install dependencies
pip install -r requirements.txt --break-system-packages

# Or install in virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### **Environment Setup**

Create a `.env` file in your project root:

```bash
# OpenAI (required for production)
OPENAI_API_KEY=sk-your-api-key-here

# Ollama (optional, for local LLMs)
OLLAMA_BASE_URL=http://localhost:11434
```

---

## 📚 **Usage Examples**

### **Embeddings**

#### **Basic Usage**

```python
from shared.embeddings import create_embedding_generator, EmbeddingProvider

# Create generator with OpenAI
generator = create_embedding_generator(
    provider="openai",
    model="text-embedding-3-small"
)

# Embed single text
text = "What is the EMD requirement for this tender?"
embedding = generator.embed_query(text)
print(f"Embedding dimension: {len(embedding)}")

# Embed multiple documents
documents = [
    "Technical specifications for highway construction",
    "Commercial terms and payment schedule",
    "Eligibility criteria for bidders"
]
embeddings = generator.embed_documents(documents)
print(f"Generated {len(embeddings)} embeddings")
```

#### **With Custom Configuration**

```python
from shared.embeddings import EmbeddingConfig, EmbeddingGenerator, EmbeddingProvider

config = EmbeddingConfig(
    provider=EmbeddingProvider.OPENAI,
    model="text-embedding-3-small",
    dimensions=1536,  # Reduce dimensions for faster search
    batch_size=100,
    cache_enabled=True
)

generator = EmbeddingGenerator(config)

# Use caching for repeated texts
embedding1 = generator.embed_query("Sample query")
embedding2 = generator.embed_query("Sample query")  # From cache
print(f"Cache size: {generator.get_cache_size()}")
```

#### **Calculate Similarity**

```python
# Calculate cosine similarity between embeddings
similarity = generator.calculate_similarity(embeddings[0], embeddings[1])
print(f"Similarity: {similarity:.4f}")
```

#### **Using Local Embeddings (Ollama)**

```python
from shared.embeddings import create_embedding_generator

# Use local embeddings (no API key needed)
generator = create_embedding_generator(
    provider="ollama",
    model="nomic-embed-text"
)

embedding = generator.embed_query("Test query")
```

---

### **LLM Utils**

#### **Basic Question-Answer**

```python
from shared.llm_utils import create_llm_manager

# Create LLM manager
manager = create_llm_manager(
    provider="openai",
    model="gpt-4o-mini",
    temperature=0.7
)

# Ask a question
response = manager.generate(
    prompt="What is EMD in tender context?",
    system_message="You are a procurement expert."
)
print(response)
```

#### **With Context (RAG)**

```python
# Generate response with context from retrieved documents
context = """
EMD (Earnest Money Deposit) is a security deposit required from bidders.
For highway projects, EMD is typically 2% of the estimated cost.
EMD must be submitted as a bank guarantee or demand draft.
"""

response = manager.generate_with_context(
    prompt="What is the EMD requirement?",
    context=context,
    system_message="Answer based on the context provided."
)
print(response)
```

#### **JSON Output**

```python
# Get structured JSON response
schema = {
    "category": "string",
    "intent": "string",
    "required_info": ["string"]
}

result = manager.generate_json(
    prompt="Analyze this query: What is the minimum EMD amount?",
    schema=schema
)
print(result)
# Output: {"category": "commercial", "intent": "EMD requirement", ...}
```

#### **Conversation Mode**

```python
# Multi-turn conversation with history
response1 = manager.chat("What is a corrigendum?")
print("Bot:", response1)

response2 = manager.chat("When should it be issued?")
print("Bot:", response2)

# View conversation history
history = manager.get_history()
print(f"Conversation has {len(history)} messages")
```

#### **Token Counting & Cost Estimation**

```python
# Count tokens
prompt = "Long prompt text here..."
token_count = manager.count_tokens(prompt)
print(f"Tokens: {token_count}")

# Estimate cost
cost = manager.estimate_cost(
    input_tokens=1000,
    output_tokens=500
)
print(f"Estimated cost: ${cost:.4f}")
```

#### **Using Prompt Templates**

```python
from shared.llm_utils import PromptTemplateManager

# Format a pre-built template
prompt = PromptTemplateManager.format_template(
    "query_analysis",
    query="What is the minimum EMD amount?"
)

response = manager.generate(prompt)
```

#### **Available Templates**

```python
# List of built-in templates
templates = [
    "query_analysis",           # Analyze vendor queries
    "answer_generation",        # Generate answers with context
    "document_summarization",   # Summarize tender documents
    "compliance_check",         # Check RFP compliance
    "corrigendum_generation"    # Generate corrigenda
]

# Use a template
prompt = PromptTemplateManager.format_template(
    "answer_generation",
    context="...",
    query="..."
)
```

---

## 🔧 **Configuration Options**

### **Embedding Configuration**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `provider` | str | "openai" | openai, huggingface, ollama |
| `model` | str | auto | Embedding model name |
| `api_key` | str | from env | OpenAI API key |
| `base_url` | str | localhost:11434 | Ollama server URL |
| `dimensions` | int | None | Embedding dimensions (OpenAI 3.x) |
| `chunk_size` | int | 1000 | Chunk size for processing |
| `batch_size` | int | 100 | Batch size for embeddings |
| `cache_enabled` | bool | True | Enable embedding caching |

### **LLM Configuration**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `provider` | str | "openai" | openai, ollama |
| `model` | str | gpt-4o-mini | LLM model name |
| `api_key` | str | from env | OpenAI API key |
| `base_url` | str | localhost:11434 | Ollama server URL |
| `temperature` | float | 0.7 | Sampling temperature (0-2) |
| `max_tokens` | int | 2000 | Maximum tokens in response |
| `top_p` | float | 1.0 | Nucleus sampling parameter |
| `streaming` | bool | False | Enable streaming responses |
| `timeout` | int | 120 | Request timeout in seconds |
| `max_retries` | int | 3 | Maximum retry attempts |

---

## 🌟 **Advanced Usage**

### **Batch Processing Large Documents**

```python
from shared.embeddings import BatchEmbeddingProcessor

processor = BatchEmbeddingProcessor(generator)

# Process 10,000 documents efficiently
large_document_set = [...]  # Your documents
embeddings = processor.process_documents(
    documents=large_document_set,
    show_progress=True
)
```

### **Custom Prompt Templates**

```python
from langchain_core.prompts import PromptTemplate

# Create custom template
custom_template = PromptTemplate.from_template(
    """You are analyzing tender document: {document_name}

Section: {section}

Task: {task}

Provide your analysis:"""
)

# Use with LLM
formatted = custom_template.format(
    document_name="RFP-2024-NH-001",
    section="Technical Specifications",
    task="Identify missing clauses"
)

response = manager.generate(formatted)
```

### **Conversation History Management**

```python
# Save conversation
manager.save_history("conversation_2024-01-16.json")

# Load conversation
manager.load_history("conversation_2024-01-16.json")

# Clear history
manager.clear_history()
```

---

## 🎯 **Integration with RAG Services**

### **Screen 7: History Retriever**

```python
from shared.embeddings import create_embedding_generator
from shared.llm_utils import create_llm_manager

# Initialize utilities
embedding_gen = create_embedding_generator(provider="openai")
llm_manager = create_llm_manager(provider="openai", model="gpt-4o-mini")

# Embed uploaded document
doc_text = "RFP document content..."
doc_embedding = embedding_gen.embed_query(doc_text)

# Store in ChromaDB
# ... (ChromaDB code)

# Search for similar documents
query = "EMD requirement"
query_embedding = embedding_gen.embed_query(query)

# ... (retrieve similar docs from ChromaDB)

# Generate summary
summary = llm_manager.generate(
    prompt=f"Summarize this document: {doc_text[:1000]}..."
)
```

### **Screen 8: Chief Engineer**

```python
from shared.embeddings import create_embedding_generator
from shared.llm_utils import create_llm_manager, PromptTemplateManager

embedding_gen = create_embedding_generator(provider="openai")
llm_manager = create_llm_manager(provider="openai")

# Process vendor query
vendor_query = "What is the minimum EMD amount?"

# Find similar past queries
query_embedding = embedding_gen.embed_query(vendor_query)
# ... (search in vector store)

# Generate response with context
context = "Retrieved historical Q&A..."
prompt = PromptTemplateManager.format_template(
    "answer_generation",
    context=context,
    query=vendor_query
)

response = llm_manager.generate(prompt)
```

---

## 📊 **Model Comparison**

### **Embedding Models**

| Provider | Model | Dimensions | Cost | Speed | Quality |
|----------|-------|------------|------|-------|---------|
| OpenAI | text-embedding-3-small | 1536 | Low | Fast | Good |
| OpenAI | text-embedding-3-large | 3072 | Medium | Medium | Excellent |
| OpenAI | text-embedding-ada-002 | 1536 | Low | Fast | Good |
| HuggingFace | all-mpnet-base-v2 | 768 | Free | Fast | Good |
| Ollama | nomic-embed-text | 768 | Free | Fast | Good |

### **LLM Models**

| Provider | Model | Context | Cost | Speed | Quality |
|----------|-------|---------|------|-------|---------|
| OpenAI | gpt-4o | 128K | High | Medium | Excellent |
| OpenAI | gpt-4o-mini | 128K | Low | Fast | Very Good |
| OpenAI | gpt-3.5-turbo | 16K | Very Low | Very Fast | Good |
| Ollama | llama3:8b | 8K | Free | Medium | Good |
| Ollama | llama3:70b | 8K | Free | Slow | Very Good |

---

## 🐛 **Troubleshooting**

### **OpenAI API Key Error**

```
Error: OpenAI API key is required
```

**Solution:** Set the environment variable:
```bash
export OPENAI_API_KEY=sk-your-key-here
```

### **Ollama Connection Error**

```
Error: Failed to connect to Ollama
```

**Solution:** 
1. Ensure Ollama is running: `ollama serve`
2. Check URL: `http://localhost:11434`
3. Test with: `ollama list`

### **Import Errors**

```
ModuleNotFoundError: No module named 'langchain'
```

**Solution:**
```bash
pip install -r requirements.txt --break-system-packages
```

### **CUDA/GPU Errors (HuggingFace)**

**Solution:** Use CPU mode in config:
```python
config = EmbeddingConfig(
    provider="huggingface",
    model="sentence-transformers/all-mpnet-base-v2"
)
# Model loads on CPU by default
```

---

## 📝 **Best Practices**

1. **Use Caching:** Enable caching for repeated queries
2. **Batch Processing:** Process multiple documents in batches
3. **Token Limits:** Monitor token usage for cost control
4. **Error Handling:** Wrap LLM calls in try-except blocks
5. **Temperature:** Use 0.3-0.7 for factual tasks, 0.7-1.0 for creative
6. **Local Development:** Use Ollama for development, OpenAI for production
7. **Prompt Engineering:** Use templates for consistent outputs

---

## 🔒 **Security Notes**

- Never commit API keys to version control
- Use environment variables for sensitive data
- Implement rate limiting for production
- Validate user inputs before passing to LLM
- Monitor API usage and costs

---

## 📞 **Support**

For issues or questions:
- Check logs in terminal output
- Review error messages carefully
- Verify API keys and environment variables
- Test with simple examples first
- Contact NHAI development team

---

## 📄 **License**

Proprietary - NHAI Internal Use Only

---

**Version:** 1.0.0  
**Last Updated:** January 16, 2026  
**Maintained by:** NHAI Development Team
