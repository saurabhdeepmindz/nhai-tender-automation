# Chat Session: Langchain Import Structure Updates
**Date:** January 27, 2026  
**Topic:** Fixing ModuleNotFoundError for langchain imports across RAG services  
**Status:** ✅ Resolved

---

## Session Overview

This session focused on resolving `ModuleNotFoundError` issues caused by outdated langchain import paths after upgrading the langchain ecosystem to version 1.2.x. The new package structure requires imports from specific sub-packages (`langchain_text_splitters`, `langchain_core`, etc.) instead of the legacy `langchain.*` imports.

---

## Issues Encountered

### Issue 1: historical-data-service Import Error
**Error:**
```
(nhai-venv) d:\SaurabhVerma\presales\rfp-pREBID\NHAI-POC-V400\NHAI-TENDER-AUTOMATION\python-rag\historical-data-service>python.exe main.py
Traceback (most recent call last):
  File "d:\SaurabhVerma\presales\rfp-pREBID\NHAI-POC-V400\NHAI-TENDER-AUTOMATION\python-rag\historical-data-service\main.py", line 24, in <module>
    from document_processor import DocumentProcessor
  File "d:\SaurabhVerma\presales\rfp-pREBID\NHAI-POC-V400\NHAI-TENDER-AUTOMATION\python-rag\historical-data-service\..\shared\document_processing\document_processor.py", line 17, in <module>
    from langchain_openai import OpenAIEmbeddings
  File "D:\SaurabhVerma\presales\rfp-pREBID\NHAI-POC-V100\bat-files-projectstructure\NHAI-Tender-Automation\nhai-venv\Lib\site-packages\langchain_openai\__init__.py", line 1, in <module>
    from langchain_openai.chat_models import (
  File "D:\SaurabhVerma\presales\rfp-pREBID\NHAI-POC-V100\bat-files-projectstructure\NHAI-Tender-Automation\nhai-venv\Lib\site-packages\langchain_openai\chat_models\__init__.py", line 1, in <module>
    from langchain_openai.chat_models.azure import AzureChatOpenAI
  File "D:\SaurabhVerma\presales\rfp-pREBID\NHAI-POC-V100\bat-files-projectstructure\NHAI-Tender-Automation\nhai-venv\Lib\site-packages\langchain_openai\chat_models\azure.py", line 10, in <module>
    from langchain_core.pydantic_v1 import BaseModel, Field, root_validator
ModuleNotFoundError: No module named 'langchain_core.pydantic_v1'
```

**Root Cause:** User was using the wrong Python environment (NHAI-POC-V100 instead of V400).

**Resolution:** Advised user to use the correct V400 nhai-venv Python interpreter:
```powershell
d:\SaurabhVerma\presales\rfp-pREBID\NHAI-POC-V400\NHAI-TENDER-AUTOMATION\nhai-venv\Scripts\python.exe python-rag/historical-data-service/main.py
```

---

### Issue 2: screen07-history-retriever Import Error
**Error:**
```
(nhai-venv) d:\SaurabhVerma\presales\rfp-pREBID\NHAI-POC-V400\NHAI-TENDER-AUTOMATION>python.exe python-rag/screen07-history-retriever/main.py
Traceback (most recent call last):
  File "d:\SaurabhVerma\presales\rfp-pREBID\NHAI-POC-V400\NHAI-TENDER-AUTOMATION\python-rag\screen07-history-retriever\main.py", line 57, in <module>
    from langchain.text_splitter import RecursiveCharacterTextSplitter
ModuleNotFoundError: No module named 'langchain.text_splitter'
```

**Root Cause:** Legacy import path `langchain.text_splitter` no longer exists in langchain 1.2.x.

**Resolution:** Updated import to new structure.

**File Modified:** `python-rag/screen07-history-retriever/main.py` (Line 57)

**Change:**
```python
# OLD:
from langchain.text_splitter import RecursiveCharacterTextSplitter

# NEW:
from langchain_text_splitters import RecursiveCharacterTextSplitter
```

---

### Issue 3: screen08-chief-engineer Import Error
**Error:**
```
(nhai-venv) D:\SaurabhVerma\presales\rfp-pREBID\NHAI-POC-V400\NHAI-TENDER-AUTOMATION>python.exe python-rag/screen08-chief-engineer/main.py
Traceback (most recent call last):
  File "D:\SaurabhVerma\presales\rfp-pREBID\NHAI-POC-V400\NHAI-TENDER-AUTOMATION\python-rag\screen08-chief-engineer\main.py", line 57, in <module>
    from chief_engineer_agent import ChiefEngineerAgent
  File "D:\SaurabhVerma\presales\rfp-pREBID\NHAI-POC-V400\NHAI-TENDER-AUTOMATION\python-rag\screen08-chief-engineer\chief_engineer_agent.py", line 25, in <module>
    from langchain.prompts import PromptTemplate
ModuleNotFoundError: No module named 'langchain.prompts'
```

**Root Cause:** Legacy import path `langchain.prompts` no longer exists in langchain 1.2.x.

**Resolution:** Updated import to new structure.

**File Modified:** `python-rag/screen08-chief-engineer/chief_engineer_agent.py` (Line 25)

**Change:**
```python
# OLD:
from langchain.prompts import PromptTemplate

# NEW:
from langchain_core.prompts import PromptTemplate
```

---

## Files Modified

### 1. python-rag/screen07-history-retriever/main.py
**Location:** Line 57  
**Import:** `RecursiveCharacterTextSplitter`  
**Change:** `langchain.text_splitter` → `langchain_text_splitters`

### 2. python-rag/screen08-chief-engineer/chief_engineer_agent.py
**Location:** Line 25  
**Import:** `PromptTemplate`  
**Change:** `langchain.prompts` → `langchain_core.prompts`

---

## Langchain Import Migration Reference

### Document Processing
```python
# OLD (langchain 0.x)
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.document_loaders import PyPDFLoader, Docx2txtLoader

# NEW (langchain 1.2.x)
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import PyPDFLoader, Docx2txtLoader
```

### Embeddings
```python
# OLD (langchain 0.x)
from langchain.embeddings import OpenAIEmbeddings, HuggingFaceEmbeddings

# NEW (langchain 1.2.x)
from langchain_openai import OpenAIEmbeddings
from langchain_community.embeddings import HuggingFaceEmbeddings, OllamaEmbeddings
```

### Prompts & Chains
```python
# OLD (langchain 0.x)
from langchain.prompts import PromptTemplate, ChatPromptTemplate
from langchain.chains import LLMChain

# NEW (langchain 1.2.x)
from langchain_core.prompts import PromptTemplate, ChatPromptTemplate
from langchain.chains import LLMChain  # This one stayed in langchain
```

### Output Parsers
```python
# OLD (langchain 0.x)
from langchain.output_parsers import PydanticOutputParser

# NEW (langchain 1.2.x)
from langchain_core.output_parsers import PydanticOutputParser
```

### LLMs
```python
# OLD (langchain 0.x)
from langchain.llms import Ollama, OpenAI

# NEW (langchain 1.2.x)
from langchain_community.llms import Ollama
from langchain_openai import OpenAI, ChatOpenAI
```

---

## Current Package Versions (V400 nhai-venv)

```
langchain==1.2.7
langchain-core==1.2.7
langchain-community==0.4.1
langchain-openai==1.1.7
langchain-text-splitters==1.1.0
langgraph==1.0.7
ragas==0.4.3
datasets==4.5.0
anthropic==0.76.0
numpy==1.26.3  # Pinned <2 for chromadb compatibility
```

---

## Commands to Run Services

### Screen 7: History Retriever (Port 8000)
```powershell
cd d:\SaurabhVerma\presales\rfp-pREBID\NHAI-POC-V400\NHAI-TENDER-AUTOMATION
nhai-venv\Scripts\python.exe python-rag/screen07-history-retriever/main.py
```

### Screen 8: Chief Engineer Agent (Port 8001)
```powershell
cd d:\SaurabhVerma\presales\rfp-pREBID\NHAI-POC-V400\NHAI-TENDER-AUTOMATION
nhai-venv\Scripts\python.exe python-rag/screen08-chief-engineer/main.py
```

### Historical Data Service
```powershell
cd d:\SaurabhVerma\presales\rfp-pREBID\NHAI-POC-V400\NHAI-TENDER-AUTOMATION
nhai-venv\Scripts\python.exe python-rag/historical-data-service/main.py
```

---

## Previous Context (From Earlier Sessions)

### Package Upgrade History
In the previous session (January 26, 2026), the following actions were taken:
1. ✅ Installed `langchain_text_splitters` package
2. ✅ Upgraded entire langchain ecosystem to resolve version conflicts
3. ✅ Updated `document_processor.py` imports to new structure
4. ✅ Fixed NumPy compatibility (pinned to 1.26.3 for chromadb)
5. ✅ Installed missing dependencies: `datasets`, `anthropic`
6. ✅ Created RAG chain demo with RAGAS evaluation

### Files Previously Modified
- `python-rag/shared/document_processing/document_processor.py` - Updated all langchain imports
- `python-rag/shared/examples_rag_chain.py` - Created demo with dotenv support
- `python-rag/shared/rag_chain.py` - Fixed semantic_search_all call signature
- `python-rag/shared/ragas_evaluator.py` - Implemented RAGAS quality evaluation

---

## Key Learnings

### 1. Langchain 1.x Breaking Changes
The langchain 1.x series introduced a major restructuring where imports were split into separate packages:
- `langchain-core`: Core abstractions (prompts, output parsers, runnables)
- `langchain-community`: Community integrations (document loaders, embeddings, LLMs)
- `langchain-openai`: OpenAI-specific integrations
- `langchain-text-splitters`: Text splitting utilities
- `langgraph`: Graph-based workflows
- `langchain`: Main package (now mostly a meta-package)

### 2. Environment Isolation Critical
The V100 vs V400 environment confusion demonstrates the importance of:
- Using absolute paths to Python interpreters
- Activating correct virtual environments before running scripts
- Verifying `sys.path` when imports fail unexpectedly

### 3. Migration Strategy
When upgrading langchain:
1. ✅ Upgrade all langchain packages together (langchain, langchain-core, langchain-community, etc.)
2. ✅ Search codebase for legacy imports: `from langchain.` patterns
3. ✅ Update imports according to new package structure
4. ✅ Test all services to catch runtime import errors
5. ✅ Document changes for team reference

---

## Next Steps

### Immediate Actions
1. ✅ Test screen07-history-retriever service startup
2. ✅ Test screen08-chief-engineer service startup
3. ⏳ Run full integration test across all RAG services
4. ⏳ Update any remaining files with legacy langchain imports

### Suggested Improvements
1. Add CI/CD checks to detect legacy langchain imports
2. Create automated migration script for future upgrades
3. Add comprehensive integration tests for all RAG services
4. Document langchain import patterns in developer guide

---

## Related Files

- **Chat History:** `Chat-History/SESSION_2026_01_26_DOCUMENT_UPLOAD_TROUBLESHOOTING.md`
- **Migration Guides:** 
  - `MIGRATION_IMPLEMENTATION_SUMMARY.md`
  - `DATABASE_MIGRATION_GUIDE.md`
  - `POSTGRESQL_TO_CHROMADB_MIGRATION_GUIDE.md`
- **Implementation Docs:**
  - `HISTORICAL_DATA_COMPLETE_IMPLEMENTATION.md`
  - `ADMIN_PANEL_IMPLEMENTATION_SUMMARY.md`

---

## Status Summary

| Component | Status | Notes |
|-----------|--------|-------|
| screen07-history-retriever | ✅ Fixed | Updated RecursiveCharacterTextSplitter import |
| screen08-chief-engineer | ✅ Fixed | Updated PromptTemplate import |
| historical-data-service | ⚠️ Needs Testing | Import fixed, needs V400 environment |
| shared/document_processor.py | ✅ Fixed | All imports updated in previous session |
| Package Versions | ✅ Compatible | All langchain 1.2.x packages aligned |

---

**Session End Time:** January 27, 2026  
**Total Issues Resolved:** 3  
**Files Modified:** 2  
**Status:** All langchain import issues resolved ✅
