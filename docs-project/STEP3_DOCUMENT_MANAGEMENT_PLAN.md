# Step 3: Document Management Endpoints - Implementation Plan
**Status**: Analysis & Planning Phase (Awaiting Approval)  
**Date**: January 26, 2026

---

## 1. Current State Analysis

### ✅ Already Implemented:
- `POST /api/historical-data/upload` - Upload documents
- `GET /api/historical-data/:id` - Get document status
- `GET /api/historical-data` - List documents (with filters)
- `GET /api/historical-data/stats/summary` - Overall statistics
- `POST /api/historical-data/:id/retry` - Retry failed documents
- `POST /api/historical-data/:id/query` - Query document (NEW - Step 2)

### 📊 Database Schema:
```
historical_documents table:
- id (PK)
- rfp_number
- title
- document_type (RFP, Q&A, CORRIGENDUM)
- file_path, file_name, file_size, file_type
- status (PENDING, PROCESSING, PROCESSED, FAILED)
- processing_metadata (jsonb)
- ai_reference_count
- extracted_content
- uploaded_at, processed_at, updated_at
```

---

## 2. Step 3 Enhancements Needed

### 🎯 Requirement: "Document Management Endpoints"
Three main features:
1. **List uploaded documents** - Enhance current endpoint
2. **Delete documents** - NEW endpoint with cascading cleanup
3. **View document details and statistics** - Enhance current endpoints

---

## 3. Planned Endpoints

### 3.1 Enhanced: GET /api/historical-data
**Current**: Lists documents with basic filters  
**Enhancement**: Add pagination, role-based filtering, detailed statistics

**New Query Parameters**:
```
GET /api/historical-data?
  page=1&
  limit=10&
  type=RFP&
  status=PROCESSED&
  rfp_number=RFP-CRIS-001&
  sort_by=uploaded_at&
  sort_order=DESC
```

**New Response Format**:
```json
{
  "success": true,
  "data": {
    "documents": [
      {
        "id": 15,
        "rfp_number": "RFP-CRIS-001",
        "title": "Revamping, Support and Maintenance of Indian Railways",
        "document_type": "RFP",
        "status": "PROCESSED",
        "file_name": "rfp-document.pdf",
        "file_size": 2048576,
        "uploaded_at": "2026-01-24T10:30:00Z",
        "processed_at": "2026-01-24T10:35:00Z",
        "processing_time_seconds": 300,
        "statistics": {
          "total_chunks": 201,
          "embedding_provider": "ollama (nomic-embed-text)",
          "query_count": 5,
          "last_queried_at": "2026-01-26T12:56:19Z"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 7,
      "total_pages": 1
    },
    "summary": {
      "total_documents": 7,
      "processed": 7,
      "pending": 0,
      "failed": 0,
      "total_file_size_mb": 450.25
    }
  }
}
```

---

### 3.2 Enhanced: GET /api/historical-data/:id (Document Details)
**Current**: Returns basic status  
**Enhancement**: Add detailed statistics and query history

**New Response Format**:
```json
{
  "success": true,
  "document": {
    "id": 15,
    "rfp_number": "RFP-CRIS-001",
    "title": "Revamping, Support and Maintenance of Indian Railways",
    "document_type": "RFP",
    "status": "PROCESSED",
    "file_details": {
      "name": "rfp-document.pdf",
      "size_bytes": 2048576,
      "size_mb": 2.0,
      "mime_type": "application/pdf",
      "upload_path": "./uploads/historical/1234567-document.pdf"
    },
    "processing": {
      "status": "PROCESSED",
      "started_at": "2026-01-24T10:30:00Z",
      "completed_at": "2026-01-24T10:35:00Z",
      "duration_seconds": 300,
      "total_chunks": 201,
      "embedding_provider": "ollama (nomic-embed-text)",
      "vector_ids_count": 201
    },
    "usage": {
      "total_queries": 5,
      "last_query_at": "2026-01-26T12:56:19Z",
      "ai_reference_count": 5
    },
    "metadata": {
      "extracted_content_preview": "First 500 chars of content..."
    }
  }
}
```

---

### 3.3 NEW: DELETE /api/historical-data/:id (Delete Document)
**Purpose**: Remove document with cascading cleanup

**Cascading Operations**:
1. Delete from ChromaDB (all chunks/vectors for this document)
2. Delete from PostgreSQL (historical_documents table)
3. Delete physical file from disk
4. Delete from query logs (if any foreign key exists)
5. Rollback ai_reference_count in any related queries

**Request**: 
```
DELETE /api/historical-data/15
```

**Response**:
```json
{
  "success": true,
  "message": "Document deleted successfully",
  "deleted_document": {
    "id": 15,
    "rfp_number": "RFP-CRIS-001",
    "title": "Revamping...",
    "status": "DELETED"
  },
  "cleanup_summary": {
    "removed_from_chromadb": true,
    "vectors_deleted": 201,
    "db_record_deleted": true,
    "file_deleted": true,
    "query_logs_cleaned": 0,
    "processing_time_ms": 1234
  }
}
```

**Error Cases**:
- 404: Document not found
- 409: Document is currently being processed (can't delete while PROCESSING)

---

### 3.4 Enhanced: GET /api/historical-data/stats/summary (Overall Statistics)
**Current**: Basic counts  
**Enhancement**: Add storage info, processing metrics, usage trends

**New Response Format**:
```json
{
  "success": true,
  "statistics": {
    "documents": {
      "total": 7,
      "by_type": {
        "RFP": 5,
        "Q&A": 1,
        "CORRIGENDUM": 1
      },
      "by_status": {
        "PROCESSED": 7,
        "PENDING": 0,
        "PROCESSING": 0,
        "FAILED": 0
      }
    },
    "storage": {
      "total_size_bytes": 471859200,
      "total_size_mb": 450.25,
      "average_document_size_mb": 64.32
    },
    "vectorization": {
      "total_chunks": 1205,
      "total_vectors": 1205,
      "embedding_provider": "ollama (nomic-embed-text)",
      "average_chunks_per_document": 172.14
    },
    "usage": {
      "total_queries": 42,
      "documents_queried": 4,
      "queries_per_document_avg": 10.5
    },
    "processing": {
      "total_processing_time_seconds": 2500,
      "average_processing_time_seconds": 357.14,
      "fastest_document_seconds": 120,
      "slowest_document_seconds": 450
    },
    "last_activity": "2026-01-26T12:56:19Z"
  }
}
```

---

## 4. Files to Modify

### 4.1 Backend Files:
1. **historical-data.controller.ts**
   - Enhance `getAllDocuments()` with pagination
   - Enhance `getDocumentStatus()` with detailed stats
   - Add new `deleteDocument()` method
   - Enhance `getStatistics()` response

2. **historical-data.service.ts**
   - Enhance `getAllDocuments()` logic
   - Enhance `getDocumentStatus()` logic
   - Add new `deleteDocument()` method with cascading cleanup
   - Enhance `getStatistics()` logic
   - Add helper method: `deleteFromChromaDB()`
   - Add helper method: `cleanupQueryLogs()`

3. **dto/upload-historical-data.dto.ts**
   - Add new response DTOs for enhanced endpoints
   - Add pagination DTO

### 4.2 Python Files:
1. **python-rag/historical-data-service/main.py**
   - Add new endpoint: `DELETE /api/documents/:id`
   - Add helper to delete from ChromaDB

2. **python-rag/shared/vector_db/chroma_service.py**
   - Add new method: `delete_document_vectors(document_id)`
   - Add method to get document vector count

---

## 5. Implementation Approach

### Phase 1: Backend Enhancement (NestJS)
1. Create backup of historical-data files
2. Enhance DTOs with new response types
3. Update service layer with new logic
4. Update controller with enhanced endpoints
5. Test locally

### Phase 2: Python Service Enhancement
1. Create backup of Python service files
2. Add ChromaDB deletion logic
3. Add new DELETE endpoint
4. Test locally

### Phase 3: Integration Testing
1. Test delete cascading
2. Test pagination
3. Test statistics accuracy
4. Test role-based filtering (if applicable)

---

## 6. Key Considerations

### ✅ What's Preserved:
- All current endpoints remain functional
- Backward compatibility maintained
- Existing tests should continue to pass

### ⚠️ Important Notes:
1. **Delete is Permanent**: Documents deleted from ChromaDB can't be recovered
2. **Permission Check**: Need to verify role-based access (vendor vs admin)
3. **Cascading Cleanup**: Must handle orphaned data gracefully
4. **Performance**: Pagination important for large dataset handling

### 🔄 Role-Based Access:
```
Vendor Role:
- Can only delete own documents (future implementation)
- Can see own documents only

Admin Role:
- Can delete any document
- Can see all documents
```

---

## 7. Testing Strategy

### Unit Tests to Add:
- `deleteDocument()` - Success case
- `deleteDocument()` - Document not found
- `deleteDocument()` - Already processing
- `getAllDocuments()` - Pagination
- `getDocumentStatus()` - Enhanced response

### Integration Tests:
- Delete and verify ChromaDB cleanup
- Delete and verify file removal
- Pagination correctness

---

## 8. Files Requiring Backup

Before any changes:
```
✅ backend/src/historical-data/historical-data.controller.ts
✅ backend/src/historical-data/historical-data.service.ts
✅ backend/src/historical-data/dto/upload-historical-data.dto.ts
✅ backend/src/historical-data/dto/query-document.dto.ts
✅ python-rag/historical-data-service/main.py
✅ python-rag/shared/vector_db/chroma_service.py
```

---

## 9. Approval Checklist

**Before Implementation, Please Confirm:**
- [ ] Overall approach is acceptable
- [ ] Endpoint designs meet requirements
- [ ] Role-based access strategy aligns with system
- [ ] Delete cascading logic is appropriate
- [ ] Response formats are clear
- [ ] Ready for backup and code changes

---

**Next Steps**: Await your approval to proceed with implementation.
