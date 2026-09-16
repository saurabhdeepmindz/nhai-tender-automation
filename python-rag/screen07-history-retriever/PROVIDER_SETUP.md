# Screen 7 - Provider Configuration Guide

## Quick Switch Between Ollama and OpenAI

The History Retriever Agent (Screen 7) now supports flexible switching between **Ollama (free, local)** and **OpenAI (paid, cloud)** for embeddings.

---

## 🆓 Option 1: Use Ollama (Recommended - Free & Local)

### Step 1: Install Ollama
- **Windows**: Download from https://ollama.ai/download
- **Linux**: `curl -fsSL https://ollama.ai/install.sh | sh`
- **macOS**: `brew install ollama`

### Step 2: Start Ollama and Pull Model
```bash
# Start Ollama service
ollama serve

# In a new terminal, pull the embedding model
ollama pull nomic-embed-text
```

### Step 3: Configure .env File
Edit `python-rag/screen07-history-retriever/.env`:
```env
EMBEDDING_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_EMBEDDING_MODEL=nomic-embed-text
```

### Step 4: Run Screen 7
```bash
cd python-rag/screen07-history-retriever
python main.py
```

---

## 💰 Option 2: Use OpenAI (Paid - Cloud)

### Step 1: Get OpenAI API Key
1. Go to https://platform.openai.com/api-keys
2. Create a new API key
3. Copy the key (starts with `sk-`)

### Step 2: Configure .env File
Edit `python-rag/screen07-history-retriever/.env`:
```env
EMBEDDING_PROVIDER=openai
OPENAI_API_KEY=sk-your-actual-api-key-here
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
```

### Step 3: Run Screen 7
```bash
cd python-rag/screen07-history-retriever
python main.py
```

---

## 🔄 Switching Between Providers

Simply change the `EMBEDDING_PROVIDER` value in `.env`:

```env
# For Ollama
EMBEDDING_PROVIDER=ollama

# For OpenAI
EMBEDDING_PROVIDER=openai
```

Then restart the service.

---

## ✅ Verify Configuration

After starting the service, check the health endpoint:
```bash
curl http://localhost:8000/api/health
```

Look for the `embedding_provider` field in the response:
```json
{
  "status": "healthy",
  "service": "NHAI History Retriever Agent",
  "embedding_provider": "ollama",  // or "openai"
  ...
}
```

---

## 🛠️ Troubleshooting

### Error: "OpenAI API key is required"
- Make sure `.env` has `EMBEDDING_PROVIDER=ollama` for free usage
- Or add valid `OPENAI_API_KEY=sk-...` if using OpenAI

### Error: "Failed to connect to Ollama"
- Ensure Ollama is running: `ollama serve`
- Check URL is correct: `OLLAMA_BASE_URL=http://localhost:11434`
- Verify model is downloaded: `ollama list`

### Error: "Model not found"
- Pull the model: `ollama pull nomic-embed-text`

---

## 📊 Model Comparison

| Provider | Model | Cost | Speed | Quality | Local |
|----------|-------|------|-------|---------|-------|
| Ollama | nomic-embed-text | Free | Fast | Good | ✅ |
| OpenAI | text-embedding-3-small | $0.02/1M tokens | Very Fast | Excellent | ❌ |
| OpenAI | text-embedding-3-large | $0.13/1M tokens | Fast | Best | ❌ |

---

## 📁 Complete .env Example

```env
# ===========================================================================
# NHAI Screen 7 (History Retriever) - Environment Configuration
# ===========================================================================

# Provider Selection: "ollama" or "openai"
EMBEDDING_PROVIDER=ollama

# Ollama Configuration
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_EMBEDDING_MODEL=nomic-embed-text

# OpenAI Configuration (only needed if EMBEDDING_PROVIDER=openai)
# OPENAI_API_KEY=sk-your-openai-api-key-here
OPENAI_EMBEDDING_MODEL=text-embedding-3-small

# Server Configuration
HOST=0.0.0.0
PORT=8000

# Vector Store Configuration
VECTOR_STORE=chromadb
CHROMA_DB_DIR=./chroma_db

# RAG Configuration
CHUNK_SIZE=1000
CHUNK_OVERLAP=200
TOP_K=5
ENABLE_CACHE=true
```

---

## 🎯 Recommended Setup

For development and testing: **Use Ollama** (free, fast, local)
For production with high quality needs: **Use OpenAI** (paid, best quality)
