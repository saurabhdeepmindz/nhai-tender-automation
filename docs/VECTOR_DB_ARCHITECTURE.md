# 📚 Document Storage & Vector Database Architecture

## 🎯 Overview

The Historical Data Management system uses a **hybrid storage approach** combining:
1. **PostgreSQL** - For metadata and structured data
2. **File System / S3** - For actual document files
3. **Vector Database** - For embeddings and semantic search

This architecture enables efficient semantic search for finding similar past queries in the Pre-bid Query Management screen (Screen 07).

---

## 🏗️ Current Implementation

### What's Already Built

#### 1. PostgreSQL Schema (Metadata Storage)

```typescript
// historical_data table
{
  id: number;
  rfpNumber: string;
  title: string;
  type: 'RFP' | 'Q&A' | 'CORRIGENDUM';
  filePath: string;                    // Path to actual file
  fileSize: number;
  originalFilename: string;
  mimeType: string;
  status: 'PENDING' | 'PROCESSING' | 'PROCESSED' | 'ERROR';
  
  // TEXT EXTRACTION
  extractedContent: string;            // Full text extracted from document
  
  // VECTOR EMBEDDINGS (Ready for vector DB)
  embeddings: JSONB;                   // Can store embeddings here temporarily
  
  // METADATA
  metadata: JSONB;                     // Additional metadata
  category: string;
  tags: string[];
  relatedDocuments: string[];
  
  // AI TRACKING
  aiReferences: number;
  accuracyPercentage: number;
  lastUsed: Date;
  
  uploadDate: Date;
  uploadedBy: number;
}
```

#### 2. File Storage

```
Current: Local Filesystem
Path: ./uploads/historical-data/

Recommended Production: S3 / MinIO
Structure:
  /rfps/
    /2023/
      RFP-2023-NH-145.pdf
  /qa/
    /2023/
      RFP-2023-NH-145-QA.csv
  /corrigenda/
    /2023/
      RFP-2023-NH-145-CORR-001.pdf
```

#### 3. Embeddings Column (Prepared)

The `embeddings` JSONB column in PostgreSQL can temporarily store vector embeddings, but for production semantic search, we need a dedicated vector database.

---

## 🔍 Recommended Architecture: Hybrid Storage

```
┌─────────────────────────────────────────────────────────────┐
│                    Document Upload Flow                      │
└─────────────────────────────────────────────────────────────┘

1. User Uploads Document (RFP / Q&A / Corrigendum)
            ↓
2. Save to PostgreSQL (metadata) + File Storage (actual file)
   - Table: historical_data
   - Status: PENDING
            ↓
3. Background Job: Process Document
   a) Extract text from PDF/DOCX → extractedContent
   b) Parse Q&A CSV → structured Q&A pairs
   c) Generate embeddings using LLM → vector embeddings
            ↓
4. Store in Vector Database
   - ChromaDB / Weaviate / Qdrant / FAISS
   - Store: embeddings + metadata + document_id
            ↓
5. Update PostgreSQL
   - Status: PROCESSED
   - Reference to vector DB entry
            ↓
6. Ready for Semantic Search in Screen 07
```

---

## 🗄️ Vector Database Integration

### Recommended: ChromaDB (Easy Integration)

**Why ChromaDB?**
- Easy to set up and use
- Excellent Python integration
- Good for PoC and production
- Built-in metadata filtering
- Persistent storage

### Alternative Options

| Database | Best For | Complexity |
|----------|----------|------------|
| **ChromaDB** | Python-heavy, Easy setup | Low |
| **Weaviate** | Production, Multi-tenant | Medium |
| **Qdrant** | High performance, Rust-based | Medium |
| **FAISS** | Research, Facebook's library | Medium |
| **Pinecone** | Cloud-based, Managed | Low |

---

## 🔧 Implementation: Vector Database Integration

### Setup ChromaDB

```python
# rag_service/vector_db/chroma_service.py

import chromadb
from chromadb.config import Settings
from typing import List, Dict
import uuid

class ChromaService:
    def __init__(self):
        # Initialize ChromaDB client
        self.client = chromadb.Client(Settings(
            chroma_db_impl="duckdb+parquet",
            persist_directory="./chroma_db"  # Persistent storage
        ))
        
        # Create collections for each document type
        self.rfp_collection = self.client.get_or_create_collection(
            name="rfp_documents",
            metadata={"description": "RFP documents and content"}
        )
        
        self.qa_collection = self.client.get_or_create_collection(
            name="qa_documents",
            metadata={"description": "Pre-bid Q&A pairs"}
        )
        
        self.corrigendum_collection = self.client.get_or_create_collection(
            name="corrigendum_documents",
            metadata={"description": "Corrigendum documents"}
        )
    
    def add_rfp_document(
        self,
        document_id: int,
        rfp_number: str,
        title: str,
        content: str,
        embeddings: List[float],
        metadata: Dict
    ):
        """Add RFP document to vector database"""
        self.rfp_collection.add(
            ids=[f"rfp_{document_id}"],
            embeddings=[embeddings],
            documents=[content],
            metadatas=[{
                "document_id": document_id,
                "rfp_number": rfp_number,
                "title": title,
                "type": "RFP",
                **metadata
            }]
        )
    
    def add_qa_pair(
        self,
        document_id: int,
        rfp_number: str,
        query: str,
        response: str,
        query_embeddings: List[float],
        metadata: Dict
    ):
        """Add Q&A pair to vector database"""
        # Store query-response as combined text
        combined_text = f"Query: {query}\nResponse: {response}"
        
        self.qa_collection.add(
            ids=[f"qa_{document_id}_{uuid.uuid4().hex[:8]}"],
            embeddings=[query_embeddings],
            documents=[combined_text],
            metadatas=[{
                "document_id": document_id,
                "rfp_number": rfp_number,
                "query": query,
                "response": response,
                "type": "Q&A",
                **metadata
            }]
        )
    
    def add_corrigendum(
        self,
        document_id: int,
        rfp_number: str,
        title: str,
        content: str,
        embeddings: List[float],
        metadata: Dict
    ):
        """Add corrigendum to vector database"""
        self.corrigendum_collection.add(
            ids=[f"corr_{document_id}"],
            embeddings=[embeddings],
            documents=[content],
            metadatas=[{
                "document_id": document_id,
                "rfp_number": rfp_number,
                "title": title,
                "type": "CORRIGENDUM",
                **metadata
            }]
        )
    
    def semantic_search_qa(
        self,
        query: str,
        query_embeddings: List[float],
        rfp_number: str = None,
        n_results: int = 5
    ) -> List[Dict]:
        """
        Semantic search for similar Q&A pairs
        Used in Screen 07 (Pre-bid Query Management)
        """
        where_filter = None
        if rfp_number:
            where_filter = {"rfp_number": rfp_number}
        
        results = self.qa_collection.query(
            query_embeddings=[query_embeddings],
            n_results=n_results,
            where=where_filter
        )
        
        return self._format_results(results)
    
    def semantic_search_rfp(
        self,
        query: str,
        query_embeddings: List[float],
        n_results: int = 3
    ) -> List[Dict]:
        """Search for relevant RFP sections"""
        results = self.rfp_collection.query(
            query_embeddings=[query_embeddings],
            n_results=n_results
        )
        
        return self._format_results(results)
    
    def _format_results(self, results) -> List[Dict]:
        """Format ChromaDB results"""
        formatted = []
        
        for i in range(len(results['ids'][0])):
            formatted.append({
                'id': results['ids'][0][i],
                'document': results['documents'][0][i],
                'metadata': results['metadatas'][0][i],
                'distance': results['distances'][0][i] if 'distances' in results else None,
                'similarity': 1 - results['distances'][0][i] if 'distances' in results else None
            })
        
        return formatted
```

---

## 📄 Document Processing Pipeline

### Complete Processing Flow

```python
# rag_service/document_processor.py

from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.embeddings import OpenAIEmbeddings, HuggingFaceEmbeddings
from langchain.document_loaders import PyPDFLoader, Docx2txtLoader, CSVLoader
import pandas as pd
from typing import List, Dict
import os

class DocumentProcessor:
    def __init__(self, embedding_model="openai"):
        # Initialize embeddings
        if embedding_model == "openai":
            self.embeddings = OpenAIEmbeddings()
        else:
            # Use local model for cost savings
            self.embeddings = HuggingFaceEmbeddings(
                model_name="sentence-transformers/all-mpnet-base-v2"
            )
        
        # Text splitter for chunking large documents
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            length_function=len,
        )
    
    async def process_rfp_document(
        self,
        file_path: str,
        document_id: int,
        rfp_number: str,
        title: str
    ) -> Dict:
        """Process RFP document"""
        # 1. Load document
        if file_path.endswith('.pdf'):
            loader = PyPDFLoader(file_path)
        elif file_path.endswith('.docx'):
            loader = Docx2txtLoader(file_path)
        else:
            raise ValueError(f"Unsupported file type: {file_path}")
        
        documents = loader.load()
        
        # 2. Extract full text
        full_text = "\n".join([doc.page_content for doc in documents])
        
        # 3. Split into chunks for better semantic search
        text_chunks = self.text_splitter.split_text(full_text)
        
        # 4. Generate embeddings for each chunk
        chunk_embeddings = []
        for chunk in text_chunks:
            embedding = self.embeddings.embed_query(chunk)
            chunk_embeddings.append({
                'text': chunk,
                'embedding': embedding
            })
        
        # 5. Generate embedding for full document (average of chunks)
        import numpy as np
        full_doc_embedding = np.mean(
            [ce['embedding'] for ce in chunk_embeddings],
            axis=0
        ).tolist()
        
        return {
            'extracted_content': full_text,
            'text_chunks': text_chunks,
            'chunk_embeddings': chunk_embeddings,
            'document_embedding': full_doc_embedding,
            'metadata': {
                'document_id': document_id,
                'rfp_number': rfp_number,
                'title': title,
                'num_pages': len(documents),
                'num_chunks': len(text_chunks)
            }
        }
    
    async def process_qa_csv(
        self,
        file_path: str,
        document_id: int,
        rfp_number: str
    ) -> List[Dict]:
        """Process Q&A CSV file"""
        # Expected CSV format:
        # Query_ID, Category, Query, Response, Date
        
        df = pd.read_csv(file_path)
        
        qa_pairs = []
        
        for _, row in df.iterrows():
            query = row.get('Query', '')
            response = row.get('Response', '')
            category = row.get('Category', 'General')
            
            if not query or not response:
                continue
            
            # Generate embedding for the query
            query_embedding = self.embeddings.embed_query(query)
            
            # Also embed the response for better matching
            response_embedding = self.embeddings.embed_query(response)
            
            # Combined embedding (weighted average: 70% query, 30% response)
            import numpy as np
            combined_embedding = (
                0.7 * np.array(query_embedding) +
                0.3 * np.array(response_embedding)
            ).tolist()
            
            qa_pairs.append({
                'query': query,
                'response': response,
                'category': category,
                'query_embedding': query_embedding,
                'response_embedding': response_embedding,
                'combined_embedding': combined_embedding,
                'metadata': {
                    'document_id': document_id,
                    'rfp_number': rfp_number,
                    'category': category,
                    'date': row.get('Date', '')
                }
            })
        
        return qa_pairs
    
    async def process_corrigendum(
        self,
        file_path: str,
        document_id: int,
        rfp_number: str,
        title: str
    ) -> Dict:
        """Process corrigendum document"""
        # Similar to RFP processing
        return await self.process_rfp_document(
            file_path, document_id, rfp_number, title
        )
```

---

## 🔄 Background Job Processing

### Using Bull Queue (NestJS)

```typescript
// historical-data/processors/document-processing.processor.ts

import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { HistoricalDataService } from '../historical-data.service';

@Processor('document-processing')
export class DocumentProcessingProcessor {
  private readonly logger = new Logger(DocumentProcessingProcessor.name);

  constructor(
    private historicalDataService: HistoricalDataService,
    private httpService: HttpService,
  ) {}

  @Process('process-document')
  async processDocument(job: Job) {
    const { documentId, filePath, type, rfpNumber, title } = job.data;

    this.logger.log(`Processing document ${documentId}: ${type}`);

    try {
      // Update status to PROCESSING
      await this.historicalDataService.updateHistoricalData(documentId, {
        status: 'PROCESSING' as any,
      });

      // Call Python RAG service to process document
      const ragServiceUrl = process.env.RAG_SERVICE_URL || 'http://localhost:8000';
      
      const response = await this.httpService.post(
        `${ragServiceUrl}/process-document`,
        {
          document_id: documentId,
          file_path: filePath,
          document_type: type,
          rfp_number: rfpNumber,
          title: title,
        },
      ).toPromise();

      const result = response.data;

      // Update database with extracted content and embeddings
      await this.historicalDataService.updateHistoricalData(documentId, {
        status: 'PROCESSED' as any,
        extractedContent: result.extracted_content,
        metadata: {
          ...result.metadata,
          vector_db_stored: true,
          processing_completed_at: new Date().toISOString(),
        },
      });

      this.logger.log(`Document ${documentId} processed successfully`);

      return { success: true, documentId };

    } catch (error) {
      this.logger.error(`Error processing document ${documentId}:`, error.message);

      // Update status to ERROR
      await this.historicalDataService.updateHistoricalData(documentId, {
        status: 'ERROR' as any,
        errorMessage: error.message,
      });

      throw error;
    }
  }
}
```

### Modified Upload Service

```typescript
// historical-data/historical-data.service.ts

async uploadHistoricalData(
  dto: UploadHistoricalDataDto,
  userId: number,
): Promise<UploadResponseDto> {
  try {
    // ... existing code ...

    const saved = await this.historicalDataRepository.save(historicalData);

    // Add to processing queue
    await this.documentProcessingQueue.add('process-document', {
      documentId: saved.id,
      filePath: saved.filePath,
      type: saved.type,
      rfpNumber: saved.rfpNumber,
      title: saved.title,
    });

    // ... rest of code ...
  }
}
```

---

## 🔍 Integration with Screen 07 (Pre-bid Query Management)

### When Vendor Submits Query

```typescript
// pre-bid-query/pre-bid-query.service.ts

import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';

@Injectable()
export class PreBidQueryService {
  constructor(
    private httpService: HttpService,
  ) {}

  async handleVendorQuery(
    queryText: string,
    rfpNumber: string,
    userId: number,
  ) {
    // 1. Call RAG service for semantic search
    const ragServiceUrl = process.env.RAG_SERVICE_URL || 'http://localhost:8000';
    
    const searchResponse = await this.httpService.post(
      `${ragServiceUrl}/semantic-search`,
      {
        query: queryText,
        rfp_number: rfpNumber,
        search_type: 'qa_pairs',  // Search in Q&A collection
        n_results: 5,
      },
    ).toPromise();

    const similarQueries = searchResponse.data.results;

    // 2. Find similar queries from past
    const pastReferences = similarQueries.map(result => ({
      rfpNumber: result.metadata.rfp_number,
      originalQuery: result.metadata.query,
      originalResponse: result.metadata.response,
      similarity: result.similarity,
      documentId: result.metadata.document_id,
    }));

    // 3. Generate AI response using RAG
    const aiResponse = await this.httpService.post(
      `${ragServiceUrl}/generate-response`,
      {
        query: queryText,
        rfp_number: rfpNumber,
        similar_queries: pastReferences,
        context_type: 'pre_bid_query',
      },
    ).toPromise();

    // 4. Save query and AI response
    const savedQuery = await this.saveQuery({
      queryText,
      rfpNumber,
      userId,
      aiGeneratedResponse: aiResponse.data.response,
      confidence: aiResponse.data.confidence,
      pastReferences,
    });

    // 5. Track AI references
    for (const ref of pastReferences) {
      await this.historicalDataService.trackAIReference({
        historicalDataId: ref.documentId,
        rfpNumber: rfpNumber,
        queryContext: queryText,
        accuracyScore: ref.similarity * 100,
        referenceTime: new Date(),
      });
    }

    return {
      queryId: savedQuery.id,
      aiResponse: aiResponse.data.response,
      confidence: aiResponse.data.confidence,
      similarPastQueries: pastReferences,
      sourceDocuments: aiResponse.data.source_documents,
    };
  }
}
```

### Python RAG Service Endpoint

```python
# rag_service/main.py

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Optional
from document_processor import DocumentProcessor
from vector_db.chroma_service import ChromaService
from langchain.chat_models import ChatOpenAI
from langchain.prompts import ChatPromptTemplate

app = FastAPI()

document_processor = DocumentProcessor()
chroma_service = ChromaService()
llm = ChatOpenAI(model="gpt-4", temperature=0.3)

class SemanticSearchRequest(BaseModel):
    query: str
    rfp_number: Optional[str] = None
    search_type: str = "qa_pairs"  # or "rfp_documents"
    n_results: int = 5

class GenerateResponseRequest(BaseModel):
    query: str
    rfp_number: str
    similar_queries: List[Dict]
    context_type: str = "pre_bid_query"

@app.post("/semantic-search")
async def semantic_search(request: SemanticSearchRequest):
    """
    Semantic search for similar past queries
    Used by Screen 07 (Pre-bid Query Management)
    """
    # Generate embeddings for the query
    query_embedding = document_processor.embeddings.embed_query(request.query)
    
    # Search in ChromaDB
    if request.search_type == "qa_pairs":
        results = chroma_service.semantic_search_qa(
            query=request.query,
            query_embeddings=query_embedding,
            rfp_number=request.rfp_number,
            n_results=request.n_results
        )
    else:
        results = chroma_service.semantic_search_rfp(
            query=request.query,
            query_embeddings=query_embedding,
            n_results=request.n_results
        )
    
    return {
        "query": request.query,
        "results": results,
        "total_found": len(results)
    }

@app.post("/generate-response")
async def generate_response(request: GenerateResponseRequest):
    """
    Generate AI response for vendor query using RAG
    """
    # Build context from similar past queries
    context = "PAST SIMILAR QUERIES AND RESPONSES:\n\n"
    
    for i, sim_query in enumerate(request.similar_queries, 1):
        context += f"{i}. Query: {sim_query['originalQuery']}\n"
        context += f"   Response: {sim_query['originalResponse']}\n"
        context += f"   Similarity: {sim_query['similarity']:.2%}\n\n"
    
    # Create prompt
    prompt = ChatPromptTemplate.from_messages([
        ("system", """You are an expert assistant for NHAI tender query management.
        Your task is to generate a clear, accurate response to a vendor's query about an RFP.
        
        Use the past similar queries and responses as reference, but adapt your response to the specific query.
        Be concise, professional, and cite relevant RFP sections when applicable."""),
        ("human", f"""RFP Number: {request.rfp_number}
        
        Vendor Query: {request.query}
        
        {context}
        
        Based on the above context and similar past queries, provide a comprehensive response to the vendor's query.""")
    ])
    
    # Generate response
    chain = prompt | llm
    response = chain.invoke({})
    
    return {
        "query": request.query,
        "response": response.content,
        "confidence": calculate_confidence(request.similar_queries),
        "source_documents": [sq['rfpNumber'] for sq in request.similar_queries[:3]]
    }

def calculate_confidence(similar_queries: List[Dict]) -> float:
    """Calculate confidence score based on similarity of past queries"""
    if not similar_queries:
        return 0.5
    
    # Average of top 3 similarities
    top_similarities = [sq['similarity'] for sq in similar_queries[:3]]
    avg_similarity = sum(top_similarities) / len(top_similarities)
    
    # Convert to confidence (0.7-1.0 range)
    confidence = 0.7 + (avg_similarity * 0.3)
    return min(confidence, 1.0)

@app.post("/process-document")
async def process_document_endpoint(request: Dict):
    """
    Process uploaded document and store in vector DB
    Called by background job processor
    """
    document_id = request['document_id']
    file_path = request['file_path']
    document_type = request['document_type']
    rfp_number = request['rfp_number']
    title = request['title']
    
    if document_type == 'RFP':
        # Process RFP
        result = await document_processor.process_rfp_document(
            file_path, document_id, rfp_number, title
        )
        
        # Store in ChromaDB
        chroma_service.add_rfp_document(
            document_id=document_id,
            rfp_number=rfp_number,
            title=title,
            content=result['extracted_content'],
            embeddings=result['document_embedding'],
            metadata=result['metadata']
        )
        
    elif document_type == 'Q&A':
        # Process Q&A CSV
        qa_pairs = await document_processor.process_qa_csv(
            file_path, document_id, rfp_number
        )
        
        # Store each Q&A pair in ChromaDB
        for qa in qa_pairs:
            chroma_service.add_qa_pair(
                document_id=document_id,
                rfp_number=rfp_number,
                query=qa['query'],
                response=qa['response'],
                query_embeddings=qa['combined_embedding'],
                metadata=qa['metadata']
            )
        
        result = {
            'extracted_content': f"Processed {len(qa_pairs)} Q&A pairs",
            'metadata': {
                'qa_pairs_count': len(qa_pairs)
            }
        }
        
    elif document_type == 'CORRIGENDUM':
        # Process Corrigendum
        result = await document_processor.process_corrigendum(
            file_path, document_id, rfp_number, title
        )
        
        # Store in ChromaDB
        chroma_service.add_corrigendum(
            document_id=document_id,
            rfp_number=rfp_number,
            title=title,
            content=result['extracted_content'],
            embeddings=result['document_embedding'],
            metadata=result['metadata']
        )
    
    return {
        'success': True,
        'document_id': document_id,
        'extracted_content': result.get('extracted_content', ''),
        'metadata': result.get('metadata', {})
    }
```

---

## 📊 Data Flow Diagram

```
┌────────────────────────────────────────────────────────────────┐
│                     SCREEN 05: Upload Document                  │
│                  (Historical Data Management)                   │
└────────────────────────────────────────────────────────────────┘
                              ↓
                    ┌─────────────────────┐
                    │   PostgreSQL DB     │
                    │   (Metadata)        │
                    │   - RFP Number      │
                    │   - Title           │
                    │   - Status: PENDING │
                    └─────────────────────┘
                              ↓
                    ┌─────────────────────┐
                    │  File Storage       │
                    │  (Actual Files)     │
                    │  ./uploads/...      │
                    └─────────────────────┘
                              ↓
                    ┌─────────────────────┐
                    │  Background Job     │
                    │  Queue (Bull)       │
                    └─────────────────────┘
                              ↓
                    ┌─────────────────────┐
                    │  Python RAG Service │
                    │  - Extract Text     │
                    │  - Generate Embeds  │
                    └─────────────────────┘
                              ↓
                    ┌─────────────────────┐
                    │  ChromaDB           │
                    │  (Vector Database)  │
                    │  - Embeddings       │
                    │  - Metadata         │
                    └─────────────────────┘
                              ↓
                    Update PostgreSQL
                    Status: PROCESSED
                              ↓
┌────────────────────────────────────────────────────────────────┐
│              SCREEN 07: Vendor Submits Query                    │
│               (Pre-bid Query Management)                        │
└────────────────────────────────────────────────────────────────┘
                              ↓
                  Generate Query Embeddings
                              ↓
                    ┌─────────────────────┐
                    │  ChromaDB           │
                    │  Semantic Search    │
                    │  - Find Similar Q&A │
                    │  - Get Past Refs    │
                    └─────────────────────┘
                              ↓
                    ┌─────────────────────┐
                    │  RAG Service        │
                    │  - Use Past Context │
                    │  - Generate Response│
                    └─────────────────────┘
                              ↓
                    Return AI Response to Admin
                              ↓
                    Track AI Reference Usage
                    (Update PostgreSQL)
```

---

## 🔧 Environment Configuration

```env
# .env for NestJS Backend

# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=nhai_tender_db

# File Storage
UPLOAD_DIR=./uploads/historical-data
# Or for S3
# AWS_S3_BUCKET=nhai-tender-docs
# AWS_REGION=us-east-1

# RAG Service
RAG_SERVICE_URL=http://localhost:8000

# Redis (for Bull Queue)
REDIS_HOST=localhost
REDIS_PORT=6379
```

```env
# .env for Python RAG Service

# Embeddings
OPENAI_API_KEY=your-key-here
# Or use local embeddings
USE_LOCAL_EMBEDDINGS=true
EMBEDDING_MODEL=sentence-transformers/all-mpnet-base-v2

# Vector Database
CHROMA_DB_DIR=./chroma_db
# Or Weaviate
# WEAVIATE_URL=http://localhost:8080

# LLM
OPENAI_MODEL=gpt-4
OPENAI_TEMPERATURE=0.3
```

---

## 📦 Required Python Dependencies

```txt
# requirements.txt

fastapi==0.104.1
uvicorn==0.24.0
langchain==0.0.340
chromadb==0.4.18
sentence-transformers==2.2.2
openai==1.3.7
pypdf==3.17.1
python-docx==1.1.0
pandas==2.1.3
numpy==1.26.2
```

---

## 🚀 Deployment Steps

### 1. Set Up ChromaDB

```bash
# ChromaDB will auto-create on first run
mkdir -p ./chroma_db
chmod 755 ./chroma_db
```

### 2. Start Python RAG Service

```bash
cd rag_service
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000
```

### 3. Start Redis (for Bull Queue)

```bash
docker run -d -p 6379:6379 redis:alpine
```

### 4. Start NestJS Backend

```bash
npm run start:dev
```

### 5. Test Document Processing

```bash
# Upload a test document via API or UI
# Check background job processing
# Verify ChromaDB contains embeddings
```

---

## 📈 Performance Considerations

### Optimization Strategies

1. **Batch Processing**
   - Process multiple documents in parallel
   - Use queue priorities

2. **Caching**
   - Cache embeddings for frequently accessed documents
   - Cache search results

3. **Indexing**
   - Use ChromaDB metadata indexing
   - PostgreSQL indexes on foreign keys

4. **Chunking**
   - Optimal chunk size: 500-1000 tokens
   - Overlap: 100-200 tokens

---

## 🎯 Summary

### Storage Architecture

1. **PostgreSQL** → Metadata, structured data, tracking
2. **File System / S3** → Actual document files
3. **ChromaDB** → Vector embeddings for semantic search

### Document Processing

1. Upload → Save metadata + file
2. Background job → Extract text + generate embeddings
3. Store in vector DB → Ready for semantic search
4. Update status → PROCESSED

### Screen 07 Integration

1. Vendor submits query
2. Generate query embeddings
3. Semantic search in ChromaDB → Find similar past Q&A
4. Use RAG to generate response
5. Track AI reference usage

### Key Benefits

- ✅ Fast semantic search (< 100ms)
- ✅ Scalable to millions of documents
- ✅ High accuracy similarity matching
- ✅ Easy integration with existing system
- ✅ Complete audit trail

---

**Next Steps:**
1. Set up ChromaDB
2. Implement document processing pipeline
3. Create RAG service endpoints
4. Integrate with Screen 07
5. Test end-to-end flow

Let me know if you need any clarification or additional code examples!
