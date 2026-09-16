# Screen 04: AI Chatbot Assistant - API Mapping Updates

## Overview
The `screen_04_chatbot.html` file has been updated to include comprehensive API endpoints and Swagger documentation mappings, following the same format as used in `screen_07_prebid_query_management-working copy.html`.

## Changes Made

### Section 1: RFP Context Selection & Quick Questions
**Color**: Light Blue (#e3f2fd | #1976d2)

**APIs Mapped:**
- **List All RFPs**
  - Endpoint: `GET http://localhost:3000/api/rfp`
  - Swagger: `/rfp`
  
- **Get Quick Questions**
  - Endpoint: `GET http://localhost:3000/api/rfp/:id/quick-questions`
  - Swagger: `/rfp/{id}/quick-questions`

**Location:** Added above the Sidebar section to document RFP context selection functionality

---

### Section 2: Chat Messages & AI Response Processing
**Color**: Light Orange (#fff3e0 | #ff9800)

**APIs Mapped:**
- **Send Chat Message**
  - Endpoint: `POST http://localhost:3000/api/chat/messages`
  - Swagger: `/chat/messages`
  
- **Get AI Response**
  - Endpoint: `POST http://localhost:3000/api/chat/:sessionId/ai-response`
  - Swagger: `/chat/{sessionId}/ai-response`

- **Get Chat History**
  - Endpoint: `GET http://localhost:3000/api/chat/sessions/:sessionId/history`
  - Swagger: `/chat/sessions/{sessionId}/history`

**Location:** Added above the Chat Container and within the Chat Header to document message handling and AI response generation

---

### Section 3: Chat Actions & Feedback
**Color**: Light Coral (#fbe9e7 | #d84315)

**APIs Mapped:**
- **Export Conversation**
  - Endpoint: `POST http://localhost:3000/api/chat/export`
  - Swagger: `/chat/export`
  - Description: Export chat as PDF
  
- **Clear Chat Session**
  - Endpoint: `DELETE http://localhost:3000/api/chat/sessions/:sessionId`
  - Swagger: `/chat/sessions/{sessionId}`
  
- **Submit Feedback**
  - Endpoint: `POST http://localhost:3000/api/chat/feedback`
  - Swagger: `/chat/feedback`

**Location:** Added above the Footer Navigation to document export, clear, and feedback functionality

---

## HTML Structure Changes

### Updated Sections:

1. **Main Container Intro (Line ~670)**
   ```html
   <div style="background:#e3f2fd;border-left:4px solid #1976d2;padding:6px 12px;margin-bottom:15px;font-size:13px;color:#1976d2;font-weight:500;">
       Section 1: RFP Context Selection & Quick Questions<br>
       <span style="font-size:12px;color:#333;">
           API: <b>GET <a href="http://localhost:3000/api/rfp" target="_blank">http://localhost:3000/api/rfp</a></b><br>
           Swagger: <a href="http://localhost:3000/api/docs#/RFP/getApiRfp" target="_blank">/rfp</a> (List all RFPs)<br>
           Quick Questions: <b>GET <a href="http://localhost:3000/api/rfp/:id/quick-questions" target="_blank">http://localhost:3000/api/rfp/:id/quick-questions</a></b><br>
           Swagger: <a href="http://localhost:3000/api/docs#/RFP/getApiRfpQuickQuestions" target="_blank">/rfp/{id}/quick-questions</a>
       </span>
   </div>
   ```

2. **Chat Container Intro (Line ~720)**
   ```html
   <div style="background:#fff3e0;border-left:4px solid #ff9800;padding:6px 12px;margin-bottom:15px;font-size:13px;color:#e65100;font-weight:500;">
       Section 2: Chat Messages & AI Response Processing<br>
       <span style="font-size:12px;color:#333;">
           Send Message: <b>POST <a href="http://localhost:3000/api/chat/messages" target="_blank">http://localhost:3000/api/chat/messages</a></b><br>
           Swagger: <a href="http://localhost:3000/api/docs#/Chat/postApiChatMessages" target="_blank">/chat/messages</a><br>
           AI Response: <b>POST <a href="http://localhost:3000/api/chat/:sessionId/ai-response" target="_blank">http://localhost:3000/api/chat/:sessionId/ai-response</a></b><br>
           Swagger: <a href="http://localhost:3000/api/docs#/Chat/postApiChatAiResponse" target="_blank">/chat/{sessionId}/ai-response</a>
       </span>
   </div>
   ```

3. **Chat Header Info (Line ~732)**
   ```html
   <div style="background:#e0f7fa;border-left:4px solid #00838f;padding:6px 12px;margin-bottom:8px;font-size:11px;color:#00838f;font-weight:500;width:100%;margin-left:20px;">
       Chat History: <b>GET <a href="http://localhost:3000/api/chat/sessions/:sessionId/history" target="_blank">http://localhost:3000/api/chat/sessions/:sessionId/history</a></b> | Swagger: <a href="http://localhost:3000/api/docs#/Chat/getApiChatHistory" target="_blank">/chat/sessions/{sessionId}/history</a>
   </div>
   ```

4. **Footer Navigation Info (Line ~785)**
   ```html
   <div style="background:#fbe9e7;border-left:4px solid #d84315;padding:6px 12px;margin:24px 0 0 0;font-size:13px;color:#d84315;font-weight:500;">
       Section 3: Chat Actions & Feedback<br>
       <span style="font-size:12px;color:#333;">
           Export Conversation: <b>POST <a href="http://localhost:3000/api/chat/export" target="_blank">http://localhost:3000/api/chat/export</a></b><br>
           Swagger: <a href="http://localhost:3000/api/docs#/Chat/postApiChatExport" target="_blank">/chat/export</a> (Export chat as PDF)<br>
           Clear Chat: <b>DELETE <a href="http://localhost:3000/api/chat/sessions/:sessionId" target="_blank">http://localhost:3000/api/chat/sessions/:sessionId</a></b><br>
           Swagger: <a href="http://localhost:3000/api/docs#/Chat/deleteApiChatSession" target="_blank">/chat/sessions/{sessionId}</a><br>
           Submit Feedback: <b>POST <a href="http://localhost:3000/api/chat/feedback" target="_blank">http://localhost:3000/api/chat/feedback</a></b><br>
           Swagger: <a href="http://localhost:3000/api/docs#/Chat/postApiChatFeedback" target="_blank">/chat/feedback</a>
       </span>
   </div>
   ```

---

## API Endpoints Summary

| Feature | Method | Endpoint | Swagger Link |
|---------|--------|----------|--------------|
| List RFPs | GET | `/api/rfp` | `/rfp` |
| Quick Questions | GET | `/api/rfp/:id/quick-questions` | `/rfp/{id}/quick-questions` |
| Send Message | POST | `/api/chat/messages` | `/chat/messages` |
| AI Response | POST | `/api/chat/:sessionId/ai-response` | `/chat/{sessionId}/ai-response` |
| Chat History | GET | `/api/chat/sessions/:sessionId/history` | `/chat/sessions/{sessionId}/history` |
| Export Chat | POST | `/api/chat/export` | `/chat/export` |
| Clear Session | DELETE | `/api/chat/sessions/:sessionId` | `/chat/sessions/{sessionId}` |
| Submit Feedback | POST | `/api/chat/feedback` | `/chat/feedback` |

---

## Benefits of This Update

1. **Developer Reference**: Developers can now quickly find which APIs power each feature
2. **Consistent Documentation**: Matches the documentation style used in screen_07
3. **Direct Links**: Clickable links to API endpoints and Swagger documentation
4. **Clear Section Division**: Color-coded sections make it easy to navigate
5. **Functional Mapping**: Each UI feature is mapped to its corresponding backend API

---

## File Location
- **Updated File**: `d:\SaurabhVerma\presales\rfp-pREBID\NHAI-POC-V400\NHAI-TENDER-AUTOMATION\docs-project\screens\screen_04_chatbot.html`
- **File Size**: 998 lines (increased from 966 lines due to API documentation sections)

---

## Next Steps
To further enhance documentation consistency, similar API mappings can be added to:
- `screen_02_vendor_dashboard.html`
- `screen_03_query_submission.html`
- `screen_05_query_history.html`
- `screen_06_admin_dashboard.html`
- `screen_08_document_generation.html`
- And other screen HTML files in the `/screens/` folder
