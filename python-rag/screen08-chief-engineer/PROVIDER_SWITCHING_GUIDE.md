# 🔄 Provider Switching Guide - Screen 8 (Chief Engineer Agent)

**NHAI Tender Query Automation System**  
**Screen 8: Chief Engineer Agent - Ollama/OpenAI Configuration**

---

## 📋 Quick Start

Screen 8 now supports **both Ollama (free, local)** and **OpenAI (paid, cloud)** providers, just like Screen 7!

---

## 🎯 Current Configuration

Check your current setup in `.env`:

```bash
EMBEDDING_PROVIDER=ollama    # Current: Using Ollama
LLM_PROVIDER=ollama          # Current: Using Ollama
```

---

## 🔀 Switching Between Providers

### **Option 1: Use Ollama (Default - FREE)**

**Advantages:**
- ✅ Free and private
- ✅ Runs locally (no internet required)
- ✅ Fast response times
- ✅ No API costs

**Requirements:**
1. Ollama must be installed and running
2. Models must be downloaded

**Setup:**

```bash
# 1. Install Ollama (if not already installed)
# Download from: https://ollama.ai

# 2. Pull required models
ollama pull nomic-embed-text    # For embeddings (384 dimensions)
ollama pull gemma3:1b           # For LLM (lightweight, fast)

# 3. Verify Ollama is running
curl http://localhost:11434/api/version
```

**Configuration in `.env`:**

```bash
# Use Ollama (Default)
EMBEDDING_PROVIDER=ollama
LLM_PROVIDER=ollama

# Ollama settings
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_EMBEDDING_MODEL=nomic-embed-text
OLLAMA_LLM_MODEL=gemma3:1b
```

---

### **Option 2: Use OpenAI (PAID)**

**Advantages:**
- ✅ Highest quality responses
- ✅ Latest GPT models
- ✅ Better accuracy
- ✅ More reliable

**Requirements:**
1. OpenAI API account
2. API key with credits
3. Internet connection

**Setup:**

```bash
# 1. Get API key from: https://platform.openai.com/api-keys

# 2. Add API key to .env file
# Uncomment and update the line:
OPENAI_API_KEY=sk-your-actual-api-key-here
```

**Configuration in `.env`:**

```bash
# Use OpenAI
EMBEDDING_PROVIDER=openai
LLM_PROVIDER=openai

# OpenAI settings
OPENAI_API_KEY=sk-your-actual-api-key-here
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
OPENAI_LLM_MODEL=gpt-4o-mini
```

---

### **Option 3: Hybrid Setup (Mix & Match)**

You can use **different providers for embeddings and LLM**:

**Example 1: Ollama embeddings + OpenAI LLM**
```bash
EMBEDDING_PROVIDER=ollama    # Use free Ollama for embeddings
LLM_PROVIDER=openai          # Use OpenAI for better responses
OPENAI_API_KEY=sk-...
```

**Example 2: OpenAI embeddings + Ollama LLM**
```bash
EMBEDDING_PROVIDER=openai    # Use OpenAI embeddings
LLM_PROVIDER=ollama          # Use free Ollama for LLM
OPENAI_API_KEY=sk-...
```

---

## 📝 Step-by-Step Switching Process

### **To Switch from Ollama to OpenAI:**

1. **Edit `.env` file:**
   ```bash
   cd python-rag/screen08-chief-engineer
   notepad .env
   ```

2. **Update these lines:**
   ```bash
   EMBEDDING_PROVIDER=openai
   LLM_PROVIDER=openai
   OPENAI_API_KEY=sk-your-actual-key-here
   ```

3. **Restart Screen 8:**
   ```powershell
   # Stop current service (Ctrl+C in terminal)
   
   # Start with new configuration
   cd python-rag\screen08-chief-engineer
   ..\..\nhai-venv\Scripts\python.exe main.py
   ```

4. **Verify configuration:**
   ```bash
   # Check health endpoint
   curl http://localhost:8001/api/health
   
   # Should show:
   # "embedding_provider": "openai"
   # "llm_provider": "openai"
   ```

---

### **To Switch from OpenAI to Ollama:**

1. **Ensure Ollama is running:**
   ```bash
   ollama list    # Check installed models
   ```

2. **Edit `.env` file:**
   ```bash
   EMBEDDING_PROVIDER=ollama
   LLM_PROVIDER=ollama
   ```

3. **Comment out OpenAI key (optional):**
   ```bash
   # OPENAI_API_KEY=sk-...
   ```

4. **Restart Screen 8** (same as above)

---

## 🔍 Verification

After switching providers, verify the configuration:

### **1. Check Health Endpoint:**
```bash
curl http://localhost:8001/api/health
```

**Expected response:**
```json
{
  "status": "healthy",
  "service": "Chief Engineer Agent",
  "version": "1.0.0",
  "timestamp": "2026-01-21T...",
  "workflow_engine": "active",
  "embedding_provider": "ollama",    ← Should match your .env
  "llm_provider": "ollama"           ← Should match your .env
}
```

### **2. Check Server Startup Logs:**

Look for these lines in the console:

**Ollama:**
```
INFO:__main__:✓ Embedding generator initialized: ollama/nomic-embed-text
INFO:__main__:✓ LLM manager initialized: ollama/gemma3:1b
```

**OpenAI:**
```
INFO:__main__:✓ Embedding generator initialized: openai/text-embedding-3-small
INFO:__main__:✓ LLM manager initialized: openai/gpt-4o-mini
```

---

## 🎛️ Available Models

### **Ollama Models:**

**Embedding Models:**
- `nomic-embed-text` (384 dimensions) - **Recommended**
- `mxbai-embed-large` (1024 dimensions) - Larger, more accurate

**LLM Models:**
- `gemma3:1b` - Fast, lightweight (1 billion parameters)
- `llama3.2` - Balanced (3 billion parameters)
- `llama3.2:3b` - Better quality
- `mistral` - Good for reasoning

**Download models:**
```bash
ollama pull nomic-embed-text
ollama pull gemma3:1b
ollama pull llama3.2
```

### **OpenAI Models:**

**Embedding Models:**
- `text-embedding-3-small` (1536 dimensions) - **Recommended** - $0.02/1M tokens
- `text-embedding-3-large` (3072 dimensions) - Higher quality - $0.13/1M tokens

**LLM Models:**
- `gpt-4o-mini` - **Recommended** - Fast, cheap ($0.15/$0.60 per 1M tokens)
- `gpt-4o` - Highest quality ($5/$15 per 1M tokens)
- `gpt-3.5-turbo` - Older, cheaper

---

## ⚠️ Important Notes

### **Dimension Compatibility:**
- **Ollama** `nomic-embed-text`: 384 dimensions
- **OpenAI** `text-embedding-3-small`: 1536 dimensions

**⚠️ Warning:** If you switch embedding providers, you may need to **re-vectorize all queries** because embeddings have different dimensions!

### **Performance Comparison:**

| Provider | Speed | Quality | Cost | Privacy |
|----------|-------|---------|------|---------|
| Ollama   | ⚡⚡⚡ Fast | ⭐⭐ Good | 💰 Free | 🔒 100% |
| OpenAI   | ⚡⚡ Medium | ⭐⭐⭐ Best | 💰💰 Paid | ⚠️ Cloud |

---

## 🐛 Troubleshooting

### **Error: "OPENAI_API_KEY not set"**
**Solution:** 
1. Add your API key to `.env` file
2. Uncomment the line: `OPENAI_API_KEY=sk-...`
3. Restart Screen 8

### **Error: "Connection refused to localhost:11434"**
**Solution:**
1. Ensure Ollama is running: `ollama list`
2. Start Ollama if needed
3. Check Ollama URL: `OLLAMA_BASE_URL=http://localhost:11434`

### **Error: "Model not found"**
**Solution:**
```bash
# Pull the missing model
ollama pull nomic-embed-text
ollama pull gemma3:1b
```

### **Slow responses with Ollama:**
**Solution:**
- Use lighter models: `gemma3:1b` instead of larger models
- Ensure Ollama has enough RAM
- Check CPU usage

---

## 📊 Cost Estimation (OpenAI)

**Typical Usage (per query):**
- Embedding generation: ~500 tokens
- LLM response: ~1000 tokens

**Monthly Cost (1000 queries/month):**
- Embeddings: ~$0.01
- LLM (gpt-4o-mini): ~$1.50
- **Total: ~$1.51/month**

**With Ollama: $0.00** ✅

---

## 🔗 Integration with Screen 7

Both Screen 7 and Screen 8 can use **different providers independently**:

**Example Configuration:**
```bash
# Screen 7 (.env)
EMBEDDING_PROVIDER=ollama
LLM_PROVIDER=ollama

# Screen 8 (.env)
EMBEDDING_PROVIDER=openai    # Uses OpenAI for better quality
LLM_PROVIDER=openai
```

---

## ✅ Recommended Setup

**Development/Testing:**
```bash
EMBEDDING_PROVIDER=ollama
LLM_PROVIDER=ollama
```
- Free
- Fast
- Good enough for testing

**Production (Budget):**
```bash
EMBEDDING_PROVIDER=ollama       # Free embeddings
LLM_PROVIDER=openai             # Better responses
OPENAI_LLM_MODEL=gpt-4o-mini   # Cheap but good
```

**Production (Quality):**
```bash
EMBEDDING_PROVIDER=openai       # Best embeddings
LLM_PROVIDER=openai             # Best responses
OPENAI_LLM_MODEL=gpt-4o-mini   # Balanced cost/quality
```

---

## 📞 Support

**Configuration Issues:**
1. Check `.env` file syntax
2. Verify provider names: `ollama` or `openai` (lowercase)
3. Check logs for initialization errors
4. Verify API keys have no extra spaces

**Need Help?**
- Check health endpoint: `http://localhost:8001/api/health`
- Review startup logs in console
- Verify Ollama/OpenAI service status

---

**Updated:** January 21, 2026  
**Version:** 1.0.0  
**Service:** Screen 8 - Chief Engineer Agent
