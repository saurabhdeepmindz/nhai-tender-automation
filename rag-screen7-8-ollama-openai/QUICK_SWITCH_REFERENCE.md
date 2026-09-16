# ⚡ Quick Reference: Ollama ↔️ OpenAI Switching

**NHAI Tender Query Automation - Provider Switching Guide**

---

## 🎯 **Current Setup: Ollama (Free)**

Your services are configured to use Ollama by default.

**Benefits:**
- ✅ **$0 cost** - completely free
- ✅ **100% private** - data never leaves your machine
- ✅ **No internet required** - works offline
- ✅ **Unlimited queries** - no rate limits

**Requirements:**
- Ollama installed
- Models downloaded (nomic-embed-text, llama3)
- 8GB+ RAM

---

## 🔄 **How to Switch**

### **Switch to OpenAI (Just 3 Steps)**

**Step 1: Get API Key**
- Visit: https://platform.openai.com/api-keys
- Click "Create new secret key"
- Copy the key (starts with `sk-`)

**Step 2: Edit .env Files**

**Screen 7:** `screen07-history-retriever\.env`
```bash
# Change this:
EMBEDDING_PROVIDER=ollama

# To this:
EMBEDDING_PROVIDER=openai

# Add this (uncomment):
OPENAI_API_KEY=sk-your-actual-key-here
```

**Screen 8:** `screen08-chief-engineer\.env`
```bash
# Change these:
EMBEDDING_PROVIDER=ollama
LLM_PROVIDER=ollama

# To these:
EMBEDDING_PROVIDER=openai
LLM_PROVIDER=openai

# Add this (uncomment):
OPENAI_API_KEY=sk-your-actual-key-here
```

**Step 3: Restart Services**
```cmd
REM Close the service windows (Ctrl+C) or close windows
REM Then restart:
START_BOTH_SERVICES.bat
```

---

### **Switch Back to Ollama (2 Steps)**

**Step 1: Edit .env Files**

**Screen 7:** `screen07-history-retriever\.env`
```bash
# Change this:
EMBEDDING_PROVIDER=openai

# To this:
EMBEDDING_PROVIDER=ollama
```

**Screen 8:** `screen08-chief-engineer\.env`
```bash
# Change these:
EMBEDDING_PROVIDER=openai
LLM_PROVIDER=openai

# To these:
EMBEDDING_PROVIDER=ollama
LLM_PROVIDER=ollama
```

**Step 2: Restart Services**
```cmd
START_BOTH_SERVICES.bat
```

---

## 📋 **Comparison Table**

| Feature | Ollama | OpenAI |
|---------|--------|--------|
| **Cost** | FREE | ~$0.002/query |
| **Speed** | 2-5 sec | 1-3 sec |
| **Quality** | Good (85%+) | Excellent (90%+) |
| **Privacy** | 100% local | Cloud-based |
| **Setup** | Medium | Easy |
| **Internet** | Not needed | Required |
| **Limits** | None | Rate limits |

---

## 🎨 **Hybrid Setup (Best of Both)**

Use Ollama for embeddings (cheap) + OpenAI for LLM (quality):

**Screen 7:** `screen07-history-retriever\.env`
```bash
EMBEDDING_PROVIDER=ollama  # Free embeddings
```

**Screen 8:** `screen08-chief-engineer\.env`
```bash
EMBEDDING_PROVIDER=ollama  # Free embeddings
LLM_PROVIDER=openai        # Better responses
OPENAI_API_KEY=sk-your-key-here
```

**Benefits:**
- ✅ Save 50% on costs (embeddings are free)
- ✅ Get better AI responses (OpenAI LLM)
- ✅ Still private for search (Ollama embeddings)

---

## ✅ **Quick Verification**

After switching, verify with:

```cmd
curl http://localhost:8000/api/health
curl http://localhost:8001/api/health
```

**Check the response:**
- Look for `"embedding_provider": "ollama"` or `"openai"`
- Look for `"llm_provider": "ollama"` or `"openai"`

---

## 🚀 **Recommended Setup**

### **Development/Testing:**
```bash
EMBEDDING_PROVIDER=ollama
LLM_PROVIDER=ollama
```
**Why:** Free, unlimited testing

### **Production (Low Traffic):**
```bash
EMBEDDING_PROVIDER=ollama
LLM_PROVIDER=ollama
```
**Why:** No costs, good quality

### **Production (High Quality Needed):**
```bash
EMBEDDING_PROVIDER=ollama
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-your-key
```
**Why:** Best quality, 50% cost savings

### **Production (Maximum Quality):**
```bash
EMBEDDING_PROVIDER=openai
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-your-key
```
**Why:** Highest quality, fastest

---

## 💰 **Cost Calculator (OpenAI)**

### **Queries per Month:**

| Queries/Month | Embedding Cost | LLM Cost | Total |
|---------------|----------------|----------|-------|
| 1,000 | $0.02 | $2.00 | **$2.02** |
| 5,000 | $0.10 | $10.00 | **$10.10** |
| 10,000 | $0.20 | $20.00 | **$20.20** |
| 50,000 | $1.00 | $100.00 | **$101.00** |

### **Hybrid Setup (Ollama Embeddings + OpenAI LLM):**

| Queries/Month | Embedding Cost | LLM Cost | Total |
|---------------|----------------|----------|-------|
| 1,000 | $0.00 | $2.00 | **$2.00** |
| 5,000 | $0.00 | $10.00 | **$10.00** |
| 10,000 | $0.00 | $20.00 | **$20.00** |
| 50,000 | $0.00 | $100.00 | **$100.00** |

**Savings:** ~1-2% by using Ollama for embeddings!

---

## 🔧 **Configuration Templates**

### **Template 1: Pure Ollama (Current)**

**.env files:**
```bash
# Screen 7
EMBEDDING_PROVIDER=ollama
OLLAMA_EMBEDDING_MODEL=nomic-embed-text

# Screen 8
EMBEDDING_PROVIDER=ollama
LLM_PROVIDER=ollama
OLLAMA_EMBEDDING_MODEL=nomic-embed-text
OLLAMA_LLM_MODEL=llama3
```

---

### **Template 2: Pure OpenAI**

**.env files:**
```bash
# Screen 7
EMBEDDING_PROVIDER=openai
OPENAI_API_KEY=sk-your-key
OPENAI_EMBEDDING_MODEL=text-embedding-3-small

# Screen 8
EMBEDDING_PROVIDER=openai
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-your-key
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
OPENAI_LLM_MODEL=gpt-4o-mini
```

---

### **Template 3: Hybrid (Recommended)**

**.env files:**
```bash
# Screen 7
EMBEDDING_PROVIDER=ollama
OLLAMA_EMBEDDING_MODEL=nomic-embed-text

# Screen 8
EMBEDDING_PROVIDER=ollama
LLM_PROVIDER=openai
OLLAMA_EMBEDDING_MODEL=nomic-embed-text
OPENAI_API_KEY=sk-your-key
OPENAI_LLM_MODEL=gpt-4o-mini
```

---

## 📝 **Step-by-Step: First Time OpenAI Setup**

If you want to try OpenAI later:

**1. Sign up for OpenAI:**
   - Go to: https://platform.openai.com/signup
   - Create account
   - Add payment method (they give free credits!)

**2. Create API Key:**
   - Visit: https://platform.openai.com/api-keys
   - Click "Create new secret key"
   - Name it: "NHAI-Production"
   - Copy the key immediately (you won't see it again!)

**3. Test the Key:**
```cmd
curl https://api.openai.com/v1/models ^
  -H "Authorization: Bearer sk-your-key-here"
```

**4. Add to .env files:**
```bash
OPENAI_API_KEY=sk-your-actual-key-here
```

**5. Switch providers:**
```bash
EMBEDDING_PROVIDER=openai
LLM_PROVIDER=openai
```

**6. Restart services:**
```cmd
START_BOTH_SERVICES.bat
```

**7. Verify:**
```cmd
curl http://localhost:8001/api/health
```

Look for: `"llm_provider": "openai"`

---

## ⚠️ **Important Notes**

### **Ollama:**
- ✅ Keep Ollama running (look for Ollama in system tray)
- ✅ Models must be downloaded: `ollama list`
- ✅ Requires 8GB+ RAM for llama3
- ✅ First query may be slower (model loading)

### **OpenAI:**
- ✅ Requires internet connection
- ✅ API key must be valid
- ✅ Monitor usage: https://platform.openai.com/usage
- ✅ Set spending limits in OpenAI dashboard

---

## 🎉 **You're All Set!**

- ✅ **Currently using:** Ollama (free)
- ✅ **Can switch to:** OpenAI anytime (just edit .env)
- ✅ **Hybrid option:** Mix both for best value
- ✅ **No code changes:** Just configuration

**Keep both configurations in your .env files, commented/uncommented as needed!**

---

**Quick Switch:** Just change PROVIDER variables + restart  
**Cost:** Ollama = $0, OpenAI = ~$0.002/query  
**Quality:** Both work great!  
**Status:** Ready for both! ✅
