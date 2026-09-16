# 📁 Shared Utilities - Folder Placement Guide

## 🎯 Where to Place These Files

### **Project Structure:**

```
NHAI-Tender-Automation/
│
├── python-rag/                          # Python RAG Services Root
│   │
│   ├── shared/                          # ✅ CREATE THIS FOLDER
│   │   ├── __init__.py                  # ✅ Place here
│   │   ├── embeddings.py                # ✅ Place here
│   │   ├── llm_utils.py                 # ✅ Place here
│   │   ├── requirements.txt             # ✅ Place here
│   │   ├── README.md                    # ✅ Place here
│   │   ├── examples.py                  # ✅ Place here
│   │   └── DELIVERY_SUMMARY.md          # ✅ Place here
│   │
│   ├── screen07-history-retriever/      # Screen 7 Service
│   │   ├── main.py
│   │   ├── history_retriever_agent.py
│   │   ├── vector_store_manager.py
│   │   └── requirements.txt
│   │
│   └── screen08-chief-engineer/         # Screen 8 Service
│       ├── main.py
│       ├── chief_engineer_agent.py
│       ├── workflow_manager.py
│       └── requirements.txt
```

---

## 🚀 **Setup Commands**

### **Step 1: Create Shared Folder**

```bash
# Navigate to python-rag directory
cd NHAI-Tender-Automation/python-rag

# Create shared folder
mkdir -p shared

# Navigate into shared folder
cd shared
```

### **Step 2: Copy Files**

```bash
# Copy all 7 files to shared folder
cp /path/to/downloads/__init__.py .
cp /path/to/downloads/embeddings.py .
cp /path/to/downloads/llm_utils.py .
cp /path/to/downloads/requirements.txt .
cp /path/to/downloads/README.md .
cp /path/to/downloads/examples.py .
cp /path/to/downloads/DELIVERY_SUMMARY.md .
```

### **Step 3: Install Dependencies**

```bash
# Install shared utilities dependencies
pip install -r requirements.txt --break-system-packages

# Or use virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### **Step 4: Set Environment Variables**

```bash
# Create .env file in python-rag root
cd ..  # Back to python-rag folder
nano .env

# Add these lines:
OPENAI_API_KEY=sk-your-api-key-here
OLLAMA_BASE_URL=http://localhost:11434
```

### **Step 5: Test Installation**

```bash
# Navigate to shared folder
cd shared

# Run examples
python examples.py

# Or test individual imports
python -c "from embeddings import embed_text; print('Embeddings OK')"
python -c "from llm_utils import ask_llm; print('LLM Utils OK')"
```

---

## 🔗 **Import in RAG Services**

### **Screen 7: History Retriever**

Edit `screen07-history-retriever/main.py`:

```python
import sys
sys.path.append('../shared')  # Add shared to path

from embeddings import create_embedding_generator, EmbeddingProvider
from llm_utils import create_llm_manager, PromptTemplateManager

# Initialize in your service
embedding_gen = create_embedding_generator(
    provider="openai",
    model="text-embedding-3-small"
)

llm_manager = create_llm_manager(
    provider="openai",
    model="gpt-4o-mini"
)
```

### **Screen 8: Chief Engineer**

Edit `screen08-chief-engineer/main.py`:

```python
import sys
sys.path.append('../shared')  # Add shared to path

from embeddings import create_embedding_generator
from llm_utils import create_llm_manager, PromptTemplateManager

# Initialize in your service
embedding_gen = create_embedding_generator(provider="openai")
llm_manager = create_llm_manager(provider="openai")

# Use prompt templates
answer_prompt = PromptTemplateManager.format_template(
    "answer_generation",
    context=retrieved_context,
    query=vendor_query
)
```

---

## 📦 **Alternative: Install as Package**

If you want to install shared utilities as a proper Python package:

### **Option 1: Development Mode**

```bash
cd python-rag/shared

# Create setup.py
cat > setup.py << 'SETUP'
from setuptools import setup, find_packages

setup(
    name="nhai-shared-utils",
    version="1.0.0",
    packages=find_packages(),
    install_requires=[
        'langchain>=0.1.0',
        'langchain-openai>=0.0.5',
        'sentence-transformers>=2.2.2',
        'numpy>=1.24.0',
        'tiktoken>=0.5.2',
    ],
)
SETUP

# Install in development mode
pip install -e .
```

Then import anywhere:
```python
from nhai_shared_utils.embeddings import create_embedding_generator
from nhai_shared_utils.llm_utils import create_llm_manager
```

### **Option 2: PYTHONPATH**

```bash
# Add to your .bashrc or .zshrc
export PYTHONPATH="${PYTHONPATH}:/path/to/python-rag"

# Then import directly
python -c "from shared import create_embedding_generator"
```

---

## ✅ **Verification Checklist**

After setup:

- [ ] Shared folder exists: `python-rag/shared/`
- [ ] All 7 files copied to shared folder
- [ ] Dependencies installed: `pip list | grep langchain`
- [ ] Environment variables set: `echo $OPENAI_API_KEY`
- [ ] Can import embeddings: `python -c "from shared import embed_text"`
- [ ] Can import llm_utils: `python -c "from shared import ask_llm"`
- [ ] Examples run: `python examples.py`
- [ ] Screen 7 can import
- [ ] Screen 8 can import

---

## 🎯 **Quick Test**

Create a test file `test_shared.py` in `python-rag/` folder:

```python
import sys
sys.path.append('shared')

from embeddings import create_embedding_generator
from llm_utils import create_llm_manager

print("Testing shared utilities...")

# Test embeddings
embedding_gen = create_embedding_generator(provider="openai")
embedding = embedding_gen.embed_query("Test query")
print(f"✓ Embeddings working - dimension: {len(embedding)}")

# Test LLM
llm_manager = create_llm_manager(provider="openai")
response = llm_manager.generate("Say 'hello' in one word")
print(f"✓ LLM working - response: {response}")

print("\n✅ All shared utilities working!")
```

Run:
```bash
cd python-rag
python test_shared.py
```

---

## 📞 **Troubleshooting**

### **Issue: Import Error**
```python
ModuleNotFoundError: No module named 'shared'
```

**Solution:**
```python
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'shared'))
```

### **Issue: Relative Import**
```python
ImportError: attempted relative import with no known parent package
```

**Solution:** Use absolute imports with sys.path modification

### **Issue: Dependencies Not Found**
```bash
pip install -r shared/requirements.txt --break-system-packages
```

---

## 🎉 **You're Ready!**

Once all files are in place and verified:
1. ✅ Shared utilities are available
2. ✅ Screen 7 can use embeddings and LLM
3. ✅ Screen 8 can use embeddings and LLM
4. ✅ No code duplication
5. ✅ Consistent configuration
6. ✅ Easy maintenance

---

**Next Steps:**
- Update Screen 7 code to use shared utilities
- Update Screen 8 code to use shared utilities
- Test end-to-end workflows
- Deploy to production

**Version:** 1.0.0  
**Status:** Ready for Integration ✅
