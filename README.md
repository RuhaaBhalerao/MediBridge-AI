# 🏥 MediBridge AI
### AI-Powered Healthcare Insurance Claim Assistant

![React](https://img.shields.io/badge/React-19-blue?logo=react)
![Node.js](https://img.shields.io/badge/Node.js-Express-green?logo=node.js)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green?logo=mongodb)
![OpenRouter](https://img.shields.io/badge/AI-OpenRouter-purple)
![License](https://img.shields.io/badge/License-MIT-yellow)

---

## 📖 Overview

Healthcare insurance claims are often difficult for patients to understand. Insurance policies contain lengthy legal terminology, while hospital estimates use complex medical language. This makes it challenging for patients to determine:

- Is this treatment covered?
- How much will insurance pay?
- How much do I have to pay?
- Why was a claim approved or rejected?

**MediBridge AI** bridges this gap by allowing users to upload their insurance policy and hospital estimate, after which an AI assistant answers claim-related questions in simple language.

---

# 🚨 Problem Statement

Healthcare insurance documentation is:

- Difficult to understand
- Filled with legal jargon
- Time-consuming to read
- Different for every insurance company
- Hard to compare against hospital bills

Patients often spend hours contacting insurance providers just to understand whether their treatment is covered.

---
**Live deployment link**-https://medi-bridge-ai.vercel.app/
# 💡 My Solution

MediBridge AI simplifies the insurance claim process by combining document processing with Generative AI.

Users simply:

1. Login
2. Upload Insurance Policy PDF
3. Upload Hospital Estimate PDF
4. Ask questions naturally

Example:

> "Is my knee replacement covered?"

The AI reads both uploaded documents, compares them, and provides a clear explanation with supporting evidence.

---

# ✨ Features

## 🔐 Authentication

- User Registration
- Secure Login
- JWT Authentication
- Protected Routes

---

## 📄 Smart Document Upload

- Upload Insurance Policy PDF
- Upload Hospital Estimate PDF
- PDF Text Extraction
- Cloud Storage Support
- MongoDB Storage

---

## 🤖 AI Insurance Assistant

- Context-aware chatbot
- Reads uploaded documents
- Explains policy clauses
- Answers natural language questions
- Coverage analysis
- Patient payment estimation

---

## 📊 Claim Analysis

- AI-powered claim analysis
- Coverage insights
- Missing document detection
- Risk assessment

---

## 📈 Analytics

- Claim statistics
- Analysis reports
- Dashboard insights

---

## 📝 Audit Logs

Every important action is recorded.

Examples:

- Login
- Upload
- AI Chat
- Claim Analysis

---

## 📱 Responsive Interface

- React Frontend
- Modern Dashboard
- Clean UI
- Mobile Friendly

---

# 🏗 System Architecture

```mermaid
flowchart LR

    User([User])

    Frontend["React Frontend"]

    Backend["Express Backend"]

    Database[("MongoDB")]

    AI["OpenRouter AI"]

    User --> Frontend
    Frontend --> Backend

    Backend --> Database
    Database --> Backend

    Backend --> AI
    AI --> Backend

    Backend --> Frontend
    Frontend --> User
```

---

# 🔄 User Flow

```mermaid
flowchart TD

A[User Opens MediBridge]

A --> B[Register/Login]

B --> C[Dashboard]

C --> D[Upload Insurance Policy]

C --> E[Upload Hospital Estimate]

D --> F[Extract PDF Text]

E --> F

F --> G[Store in MongoDB]

G --> H[AI Chatbot]

H --> I[Ask Question]

I --> J[OpenRouter AI]

J --> K[Analyze Policy + Estimate]

K --> L[Generate Response]

L --> M[Display Answer]
```

---

# 🤖 AI Workflow

```mermaid
sequenceDiagram

participant User
participant React
participant Express
participant MongoDB
participant OpenRouter

User->>React: Upload PDFs

React->>Express: POST /upload

Express->>MongoDB: Save Claim

MongoDB-->>Express: Claim ID

User->>React: Ask Question

React->>Express: POST /chat

Express->>MongoDB: Fetch Documents

MongoDB-->>Express: Policy + Estimate

Express->>OpenRouter: Prompt

OpenRouter-->>Express: AI Response

Express-->>React: JSON Response

React-->>User: Display Answer
```

---

# 📂 Backend Workflow

```mermaid
flowchart LR

Upload --> PDFParser

PDFParser --> ClaimController

ClaimController --> MongoDB

MongoDB --> ChatController

ChatController --> AIService

AIService --> Response
```

---

# 🗄 Database Design

```mermaid
erDiagram

USER ||--o{ CLAIM : owns

USER {

ObjectId id

string name

string email

string password

}

CLAIM {

ObjectId id

string policyText

string estimateText

string status

Date createdAt

}

CLAIM ||--o{ ANALYSIS : contains

CLAIM ||--o{ AUDITLOG : generates

CHATSESSION ||--|| CLAIM : references
```

---

# 📁 Project Structure

```
MediBridge/

│

├── src/

│ ├── pages/

│ ├── services/

│ └── components/

│

├── server/

│ ├── config/

│ ├── controllers/

│ ├── middlewear/

│ ├── models/

│ ├── routes/

│ ├── services/

│ └── utils/

│

└── README.md
```

---

# 🛠 Tech Stack

### Frontend

- React
- Vite
- React Router
- Axios

### Backend

- Node.js
- Express.js

### Database

- MongoDB Atlas
- Mongoose

### AI

- OpenRouter API
- Large Language Models

### File Processing

- pdf-parse
- Multer

### Authentication

- JWT
- bcrypt


---

# 🚀 Future Scope

- OCR for scanned PDFs
- Multi-language support
- Insurance comparison
- Automatic claim approval prediction
- Fraud detection
- Doctor recommendation engine
- Email notifications
- Mobile application

---

# 🎯 Impact

MediBridge AI helps:

- Patients understand insurance policies
- Reduce claim confusion
- Save time
- Improve transparency
- Make healthcare documentation accessible to everyone



# 📜 License

MIT License
