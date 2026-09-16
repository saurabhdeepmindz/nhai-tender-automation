# ⚡ Shared Utilities - Quick Reference Card

## 📦 **Package: 7 Files, ~2,600 Lines**

```
python-rag/shared/
├── embeddings.py        (650 lines) - Embedding generation
├── llm_utils.py         (700 lines) - LLM interactions  
├── __init__.py          (50 lines)  - Package setup
├── requirements.txt     (20 lines)  - Dependencies
├── README.md            (650 lines) - Full documentation
├── examples.py          (530 lines) - 7 working examples
└── DELIVERY_SUMMARY.md  - This summary
```

---

## 🚀 **30-Second Setup**

```bash
# 1. Create folder
mkdir -p python-rag/shared && cd python-rag/shared

# 2. Copy all 7 files here

# 3. Install
pip install -r requirements.txt --break-system-packages

# 4. Set API key
export OPENAI_API_KEY=sk-your-key-here

# 5. Test
python examples.py
```

---

## 💡 **5 Most Common Use Cases**

### **1. Embed a Document** (Screen 7)
```python
from shared import create_embedding_generator

gen = create_embedding_generator(provider="openai")
embedding = gen.embed_query("RFP document text...")
# Returns: List[float] with 1536 dimensions
```

### **2. Ask LLM a Question** (Both)
```python
from shared import create_llm_manager

llm = create_llm_manager(provider="openai")
response = llm.generate("What is EMD?")
# Returns: String response
```

### **3. Generate Answer with Context** (Screen 8)
```python
from shared import create_llm_manager

llm = create_llm_manager(provider="openai")
response = llm.generate_with_context(
    prompt="What is the EMD amount?",
    context="EMD is 2% of project cost..."
)
```

### **4. Batch Process Documents** (Screen 7)
```python
from shared import create_embedding_generator

gen = create_embedding_generator(provider="openai")
docs = ["doc1", "doc2", "doc3"...]
embeddings = gen.embed_documents(docs)
# Returns: List[List[float]]
```

### **5. Get Structured JSON** (Screen 8)
```python
from shared import create_llm_manager

llm = create_llm_manager(provider="openai")
result = llm.generate_json(
    prompt="Analyze this query: What is EMD?",
    schema={"category": "string", "intent": "string"}
)
# Returns: Dict
```

---

## 🎯 **Key Classes & Methods**

### **embeddings.py**
```python
# Main class
EmbeddingGenerator
  .embed_query(text) → List[float]
  .embed_documents(texts) → List[List[float]]
  .calculate_similarity(emb1, emb2) → float
  .get_embedding_dimension() → int

# Quick functions
create_embedding_generator(provider, model)
embed_text(text)
embed_texts(texts)
```

### **llm_utils.py**
```python
# Main class
LLMManager
  .generate(prompt, system_message) → str
  .generate_with_context(prompt, context) → str
  .generate_json(prompt, schema) → Dict
  .chat(message) → str
  .count_tokens(text) → int
  .estimate_cost(input, output) → float

# Quick functions  
create_llm_manager(provider, model)
ask_llm(question)
extract_json_from_llm(prompt)

# Templates
PromptTemplateManager.format_template(name, **vars)
```

---

## 📋 **Available Templates**

```python
from shared.llm_utils import PromptTemplateManager

# 5 pre-built templates:
"query_analysis"          # Analyze vendor queries
"answer_generation"       # Generate answers with context
"document_summarization"  # Summarize documents
"compliance_check"        # Check RFP compliance
"corrigendum_generation"  # Generate corrigenda
```

---

## 🔧 **Configuration Quick Ref**

### **Embeddings**
```python
from shared.embeddings import EmbeddingConfig, EmbeddingProvider

config = EmbeddingConfig(
    provider=EmbeddingProvider.OPENAI,
    model="text-embedding-3-small",
    dimensions=1536,
    batch_size=100,
    cache_enabled=True
)
```

### **LLM**
```python
from shared.llm_utils import LLMConfig, LLMProvider

config = LLMConfig(
    provider=LLMProvider.OPENAI,
    model="gpt-4o-mini",
    temperature=0.7,
    max_tokens=2000
)
```

---

## 🌐 **Supported Providers & Models**

### **Embeddings**
| Provider | Models | Cost |
|----------|--------|------|
| OpenAI | 3-small, 3-large, ada-002 | $0.00002-0.00013/1K |
| HuggingFace | mpnet, MiniLM, instructor | Free |
| Ollama | nomic-embed, mxbai | Free (local) |

### **LLMs**
| Provider | Models | Cost |
|----------|--------|------|
| OpenAI | gpt-4o, 4o-mini, 3.5-turbo | $0.15-15/1M |
| Ollama | llama3, mistral, mixtral | Free (local) |

---

## 💰 **Cost Estimates (OpenAI)**

**Embeddings (10K docs, 500 tokens each):**
- 3-small: ~$0.10
- 3-large: ~$0.65

**LLM (1K queries, 200+300 tokens):**
- 4o-mini: $0.27/day, $8/month
- 4o: $9/day, $270/month

---

## 🔗 **Import Patterns**

### **In Screen 7/8 Services**
```python
import sys
sys.path.append('../shared')

from embeddings import create_embedding_generator
from llm_utils import create_llm_manager

# Or
from shared import create_embedding_generator
from shared import create_llm_manager
```

### **With Package Install**
```python
from nhai_shared_utils.embeddings import *
from nhai_shared_utils.llm_utils import *
```

---

## ⚠️ **Common Errors & Fixes**

| Error | Fix |
|-------|-----|
| `No module 'langchain'` | `pip install -r requirements.txt` |
| `OpenAI API key required` | `export OPENAI_API_KEY=sk-...` |
| `Ollama connection failed` | `ollama serve` |
| `Import error` | Add `sys.path.append('../shared')` |

---

## ✅ **Quick Test**

```python
# Test embeddings
from shared import embed_text
print(len(embed_text("test")))  # Should print: 1536

# Test LLM
from shared import ask_llm
print(ask_llm("Say hello"))     # Should print: Hello!
```

---

## 📞 **Need Help?**

1. Check **README.md** - Full documentation
2. Run **examples.py** - 7 working examples
3. Check **DELIVERY_SUMMARY.md** - Complete overview
4. Review error logs - Most issues are env/dependencies

---

## 🎯 **Remember:**

✅ Use **OpenAI** for production (quality)  
✅ Use **Ollama** for development (free)  
✅ Enable **caching** for efficiency  
✅ Use **batch processing** for scale  
✅ Monitor **costs** with token counting  

---

**Quick Links:**
- Full Docs: README.md
- Examples: examples.py  
- Setup Guide: FOLDER_PLACEMENT.md
- API Reference: See docstrings in code

**Version:** 1.0.0 | **Status:** Production Ready ✅
