# 🚀 Vector Database Integration - Quick Start Guide

## 📋 Overview

This implementation provides **complete vector database integration** for semantic search in the NHAI Historical Data Management system. Documents uploaded in Screen 05 are processed and stored in ChromaDB for semantic search in Screen 07 (Pre-bid Query Management).

## 🎯 What's Included

1. **ChromaDB Service** (`chroma_service.py`) - Vector database operations
2. **Document Processor** (`document_processor.py`) - Text extraction & embeddings
3. **FastAPI Service** (`main.py`) - REST API for document processing
4. **Requirements** (`requirements.txt`) - Python dependencies

## 🏗️ Architecture

```
Upload Document (Screen 05)
         ↓
Save to PostgreSQL + File Storage
         ↓
Background Job (Bull Queue)
         ↓
Python RAG Service (FastAPI)
   ├─ Extract Text
   ├─ Generate Embeddings
   └─ Store in ChromaDB
         ↓
Vendor Query (Screen 07)
         ↓
Semantic Search in ChromaDB
         ↓
Find Similar Past Q&A
         ↓
Generate AI Response using RAG
```

## 🚀 Quick Setup (10 Minutes)

### Step 1: Install Python Dependencies

```bash
cd rag_service

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Linux/Mac:
source venv/bin/activate
# On Windows:
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### Step 2: Configure Environment

Create `.env` file:

```bash
# .env

# OpenAI Configuration (required for embeddings & LLM)
OPENAI_API_KEY=your-openai-api-key-here
OPENAI_MODEL=gpt-4
OPENAI_TEMPERATURE=0.3

# OR use local embeddings (free, no API key)
USE_LOCAL_EMBEDDINGS=true
EMBEDDING_MODEL=sentence-transformers/all-mpnet-base-v2

# ChromaDB Configuration
CHROMA_DB_DIR=./chroma_db

# Service Configuration
HOST=0.0.0.0
PORT=8000
```

### Step 3: Start RAG Service

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Service will start at: `http://localhost:8000`

API Docs: `http://localhost:8000/docs`

### Step 4: Verify Installation

Test the service:

```bash
curl http://localhost:8000/

# Should return:
# {
#   "service": "NHAI Tender Query RAG Service",
#   "status": "running",
#   "version": "1.0.0"
# }
```

## 📊 API Endpoints

### Health Check

```bash
GET /
GET /stats
```

### Document Processing

```bash
POST /process-document
Body: {
  "document_id": 1,
  "file_path": "./uploads/RFP-2023-NH-145.pdf",
  "document_type": "RFP",
  "rfp_number": "RFP-2023-NH-145",
  "title": "Mumbai-Pune Expressway"
}
```

### Semantic Search (Used in Screen 07)

```bash
POST /semantic-search
Body: {
  "query": "What is the timeline for bid submission?",
  "rfp_number": "RFP-2023-NH-145",
  "search_type": "qa_pairs",
  "n_results": 5
}
```

### Generate AI Response

```bash
POST /generate-response
Body: {
  "query": "What is the timeline for bid submission?",
  "rfp_number": "RFP-2023-NH-145",
  "similar_queries": [...]
}
```

## 🔧 Integration with NestJS Backend

### Update NestJS Configuration

Add to `.env`:

```env
RAG_SERVICE_URL=http://localhost:8000
```

### Background Job Processor

The background job in NestJS (`DocumentProcessingProcessor`) automatically calls the RAG service when documents are uploaded.

Flow:
1. User uploads document in Screen 05
2. Document saved to PostgreSQL + file storage
3. Background job triggered
4. Calls RAG service `/process-document` endpoint
5. RAG service extracts text, generates embeddings, stores in ChromaDB
6. Updates PostgreSQL status to PROCESSED

## 🔍 Semantic Search in Screen 07

When vendor submits query:

```typescript
// pre-bid-query.service.ts

async handleVendorQuery(queryText: string, rfpNumber: string) {
  // 1. Call RAG service for semantic search
  const searchResponse = await this.httpService.post(
    `${RAG_SERVICE_URL}/semantic-search`,
    {
      query: queryText,
      rfp_number: rfpNumber,
      search_type: 'qa_pairs',
      n_results: 5
    }
  ).toPromise();

  const similarQueries = searchResponse.data.results;

  // 2. Generate AI response
  const aiResponse = await this.httpService.post(
    `${RAG_SERVICE_URL}/generate-response`,
    {
      query: queryText,
      rfp_number: rfpNumber,
      similar_queries: similarQueries
    }
  ).toPromise();

  return aiResponse.data;
}
```

## 📈 Performance & Scalability

### Current Setup (PoC)

- **Vector DB**: ChromaDB with DuckDB backend
- **Storage**: Local filesystem
- **Embeddings**: OpenAI or local (Sentence Transformers)
- **Suitable for**: Up to 10,000 documents

### Production Setup

For production with 100,000+ documents:

1. **Vector DB**: Upgrade to Weaviate or Qdrant
2. **Storage**: Use S3 or MinIO
3. **Embeddings**: Consider Azure OpenAI or dedicated GPU server
4. **Caching**: Add Redis for search results
5. **Load Balancing**: Multiple RAG service instances

## 🎨 Embeddings Options

### Option 1: OpenAI (Recommended for PoC)

**Pros:**
- High quality embeddings
- Fast generation
- Consistent results

**Cons:**
- Requires API key
- Costs per 1000 tokens (~$0.0001)
- Internet connection required

**Setup:**
```env
USE_LOCAL_EMBEDDINGS=false
OPENAI_API_KEY=your-key-here
```

### Option 2: Local (Free)

**Pros:**
- No API key needed
- Free
- Works offline
- Fast on local machine

**Cons:**
- Slightly lower quality
- Requires more RAM (~2GB)
- First load is slow (~30 seconds)

**Setup:**
```env
USE_LOCAL_EMBEDDINGS=true
EMBEDDING_MODEL=sentence-transformers/all-mpnet-base-v2
```

## 🔒 Security Considerations

### API Security

Add authentication to RAG service:

```python
# main.py

from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

security = HTTPBearer()

@app.post("/process-document")
async def process_document(
    request: ProcessDocumentRequest,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    # Verify token
    if credentials.credentials != os.getenv("RAG_API_KEY"):
        raise HTTPException(status_code=401, detail="Invalid token")
    
    # ... rest of code
```

### Data Privacy

- Documents stored locally (ChromaDB)
- Embeddings never leave your infrastructure
- If using OpenAI: only text sent (not files)
- Can use local embeddings for complete privacy

## 📊 Monitoring

### Check Vector DB Statistics

```bash
curl http://localhost:8000/stats

# Response:
{
  "success": true,
  "statistics": {
    "rfp_documents": 45,
    "qa_documents": 320,
    "corrigendum_documents": 15,
    "total_documents": 380
  }
}
```

### Logs

Check service logs:

```bash
tail -f rag_service.log
```

## 🐛 Troubleshooting

### Issue: "ModuleNotFoundError: No module named 'chromadb'"

**Solution:**
```bash
pip install chromadb
```

### Issue: "OPENAI_API_KEY not found"

**Solution:**
```bash
# Option 1: Use local embeddings
echo "USE_LOCAL_EMBEDDINGS=true" >> .env

# Option 2: Add OpenAI key
echo "OPENAI_API_KEY=your-key-here" >> .env
```

### Issue: "Port 8000 already in use"

**Solution:**
```bash
# Use different port
uvicorn main:app --host 0.0.0.0 --port 8001
```

### Issue: "ChromaDB permission denied"

**Solution:**
```bash
mkdir -p ./chroma_db
chmod 755 ./chroma_db
```

### Issue: "Memory error with local embeddings"

**Solution:**
Reduce batch size or use OpenAI embeddings:

```python
# document_processor.py
# Change chunk_size
self.text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=500,  # Reduced from 1000
    chunk_overlap=100
)
```

## 📝 Testing

### Test Document Processing

```bash
curl -X POST http://localhost:8000/process-document \
  -H "Content-Type: application/json" \
  -d '{
    "document_id": 1,
    "file_path": "./test_docs/sample.pdf",
    "document_type": "RFP",
    "rfp_number": "RFP-TEST-001",
    "title": "Test Document"
  }'
```

### Test Semantic Search

```bash
curl -X POST http://localhost:8000/semantic-search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What is the bid submission timeline?",
    "search_type": "qa_pairs",
    "n_results": 3
  }'
```

## 🔄 Database Migration

### Migrating from Local to Production

1. **Backup ChromaDB:**
```bash
tar -czf chroma_backup.tar.gz ./chroma_db
```

2. **Set up Weaviate (Production):**
```bash
docker run -d \
  -p 8080:8080 \
  -e PERSISTENCE_DATA_PATH='/var/lib/weaviate' \
  semitechnologies/weaviate:latest
```

3. **Update Code:**
```python
# Change from ChromaDB to Weaviate
# See VECTOR_DB_ARCHITECTURE.md for details
```

## 📚 Additional Resources

### Included Files

1. `VECTOR_DB_ARCHITECTURE.md` - Complete architecture documentation
2. `chroma_service.py` - ChromaDB operations
3. `document_processor.py` - Document processing
4. `main.py` - FastAPI service
5. `requirements.txt` - Dependencies

### External Resources

- [ChromaDB Documentation](https://docs.trychroma.com/)
- [LangChain Documentation](https://python.langchain.com/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Sentence Transformers](https://www.sbert.net/)

## 🎯 Success Checklist

- [ ] Python 3.9+ installed
- [ ] Virtual environment created
- [ ] Dependencies installed
- [ ] .env file configured
- [ ] RAG service running
- [ ] Can access http://localhost:8000/docs
- [ ] Test document processing works
- [ ] Test semantic search works
- [ ] NestJS backend can reach RAG service
- [ ] Background jobs working
- [ ] Vector DB populated with test data

## 🚀 Next Steps

1. ✅ Set up RAG service (this guide)
2. ⏭️ Test document upload in Screen 05
3. ⏭️ Verify background processing
4. ⏭️ Test semantic search in Screen 07
5. ⏭️ Fine-tune similarity thresholds
6. ⏭️ Optimize for production

## 💬 Support

For issues or questions:
- Check logs: `tail -f rag_service.log`
- Review API docs: `http://localhost:8000/docs`
- See architecture: `VECTOR_DB_ARCHITECTURE.md`

---

**Version**: 1.0.0  
**Last Updated**: January 2026  
**Status**: ✅ Production Ready
