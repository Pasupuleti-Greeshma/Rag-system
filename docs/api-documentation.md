# SmartDocs AI - REST API Documentation

Base URL: `http://localhost:5000/api`

All protected endpoints require the HTTP Header:
```
Authorization: Bearer <JWT_TOKEN>
```

---

## 1. Authentication Endpoints

### Register User
- **POST** `/auth/register`
- **Request Body:**
```json
{
  "email": "developer@example.com",
  "password": "StrongPassword123!",
  "fullName": "Jane Doe"
}
```
- **Response (201 Created):**
```json
{
  "message": "Registration successful",
  "user": {
    "id": "c8695df7-5110-48e7-ba8f-5ba7b2c93d9a",
    "email": "developer@example.com",
    "full_name": "Jane Doe"
  },
  "token": "eyJhbGciOiJIUzI1NiIsIn..."
}
```

### User Login
- **POST** `/auth/login`
- **Request Body:**
```json
{
  "email": "developer@example.com",
  "password": "StrongPassword123!"
}
```
- **Response (200 OK):**
```json
{
  "message": "Login successful",
  "user": { "id": "...", "email": "...", "full_name": "..." },
  "token": "eyJhbGciOiJIUzI1NiIsIn..."
}
```

### Current User Profile
- **GET** `/auth/me` *(Protected)*
- **Response (200 OK):**
```json
{
  "user": {
    "id": "c8695df7-5110-48e7-ba8f-5ba7b2c93d9a",
    "email": "developer@example.com",
    "full_name": "Jane Doe"
  }
}
```

---

## 2. Document Management Endpoints

### Upload Document
- **POST** `/documents/upload` *(Protected, multipart/form-data)*
- **Form Fields:**
  - `file`: PDF or TXT binary file (Max 10 MB)
  - `title`: (Optional) Custom title
- **Response (202 Accepted):**
```json
{
  "message": "Document uploaded and processing initiated",
  "document": {
    "id": "76ec280b-df08-4122-8328-984488349ae8",
    "title": "Quarterly Report",
    "status": "PROCESSING",
    "file_size": 254100
  }
}
```

### List Documents
- **GET** `/documents` *(Protected)*
- **Response (200 OK):**
```json
{
  "documents": [
    {
      "id": "76ec280b-df08-4122-8328-984488349ae8",
      "title": "Quarterly Report",
      "status": "READY",
      "total_pages": 12,
      "total_chunks": 34
    }
  ]
}
```

### Get Dashboard Statistics
- **GET** `/documents/stats` *(Protected)*
- **Response (200 OK):**
```json
{
  "totalDocuments": 5,
  "readyDocuments": 4,
  "processingDocuments": 1,
  "failedDocuments": 0
}
```

### Delete Document
- **DELETE** `/documents/:id` *(Protected)*
- **Response (200 OK):**
```json
{
  "message": "Document and vector embeddings deleted successfully"
}
```

---

## 3. Conversations and RAG Chat

### Create Conversation
- **POST** `/conversations` *(Protected)*
- **Request Body:**
```json
{
  "title": "Discussion on Q3 financial targets",
  "documentId": "76ec280b-df08-4122-8328-984488349ae8"
}
```

### Send Question / RAG Query
- **POST** `/conversations/:id/messages` *(Protected)*
- **Request Body:**
```json
{
  "question": "What was the operating profit reported in page 4?",
  "documentId": null
}
```
- **Response (200 OK):**
```json
{
  "userMessage": {
    "id": "msg-1",
    "role": "user",
    "content": "What was the operating profit reported in page 4?"
  },
  "assistantMessage": {
    "id": "msg-2",
    "role": "assistant",
    "content": "Based on [Source 1], the operating profit for Q3 was $14.2M.",
    "citations": [
      {
        "document_id": "76ec280b-df08-4122-8328-984488349ae8",
        "document_title": "Quarterly Report.pdf",
        "page_number": 4,
        "chunk_id": "chunk-981",
        "chunk_text": "Operating profit for the third quarter rose by 18% reaching $14.2M...",
        "similarity_score": 0.88
      }
    ]
  }
}
```

---

## 4. System Health Check
- **GET** `/health`
- **Response (200 OK):**
```json
{
  "status": "UP",
  "timestamp": "2026-10-20T17:30:00.000Z",
  "database": "CONNECTED",
  "environment": "development"
}
```
