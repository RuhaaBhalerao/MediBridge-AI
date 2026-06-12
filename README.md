<div align="center">

<img src="https://img.shields.io/badge/MediBridge-AI-0b6e99?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0id2hpdGUiIGQ9Ik0xMiAyQzYuNDggMiAyIDYuNDggMiAxMnM0LjQ4IDEwIDEwIDEwIDEwLTQuNDggMTAtMTBTMTcuNTIgMiAxMiAyek0xMyAxN2gtMnYtNmgydjZ6bTAtOGgtMlY3aDJ2MnoiLz48L3N2Zz4=" alt="MediBridge AI" />

# 🏥 MediBridge AI

### An AI-powered health & wellness chatbot for smarter, accessible healthcare guidance

</div>

Problem

Medical billing and insurance policies are often difficult for patients to understand.

Patients frequently struggle with:

Understanding what their insurance actually covers
Estimating out-of-pocket expenses
Comparing hospital estimates against policy benefits
Identifying hidden costs before treatment
Making financially informed healthcare decisions

As a result, many patients face unexpected medical expenses despite having insurance.

##  Overview

**MediBridge AI** is a full-stack intelligent health assistant that bridges the gap between users and healthcare information. It delivers personalized health guidance, answers medical questions in plain language, and helps users make informed decisions about their well-being — all through a clean, conversational interface.

The application pairs a responsive React frontend with a Node.js backend, communicating with an AI language model to handle health-related queries with accuracy and empathy.

>  **Disclaimer:** MediBridge AI provides informational guidance only. It is not a substitute for professional medical advice, diagnosis, or treatment.

---

##  Features

-  AI-Powered Chat — Conversational health assistant powered by a large language model, capable of answering symptom queries, wellness tips, and general medical FAQs
- Natural Language Interface — Ask questions in plain English; no medical jargon required
- Real-Time Responses — Streaming or near-instant reply generation for a smooth chat experience
- Clean, Focused UI — Minimal and accessible design optimized for health conversations
- Full-Stack Architecture — Decoupled React frontend + Express/Node.js API server
- Cloud Deployed — Hosted on Vercel for high availability and fast global delivery

---

##  Screenshots

> _Add screenshots of your app here by placing images in a `/docs/screenshots/` folder and updating the paths below._
<img width="285" height="329" alt="image" src="https://github.com/user-attachments/assets/10395d36-74bb-4f83-994d-53c7d7ccb427" />



<img width="491" height="398" alt="Screenshot 2026-06-07 204453" src="https://github.com/user-attachments/assets/4b07e5d8-c4f4-45c6-8c7b-595ee15f687c" />


<img width="493" height="322" alt="image" src="https://github.com/user-attachments/assets/a68e4836-2aca-4d8d-ad24-1de75a1b9f98" />






---

##  Architecture

```
MediBridge-AI/
├── src/                    # React frontend
│   ├── components/         # UI components (ChatWindow, MessageBubble, etc.)
│   ├── assets/             # Static assets & icons
│   ├── App.jsx             # Root application component
│   └── main.jsx            # React entry point
│
├── server/                 # Node.js / Express backend
│   ├── index.js            # Server entry point & route definitions
│   └── ...                 # Middleware, API handlers
│
├── .gitignore
└── README.md
```

**Data Flow:**

```
User Input (React)
      │
      ▼
  Express API (Node.js)
      │
      ▼
  AI Language Model (LLM API)
      │
      ▼
  Response streamed back to UI
```

---

##  Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- npm or yarn
- An API key for your AI provider (e.g. OpenAI, Anthropic, etc.)

### Installation

**1. Clone the repository**

```bash
git clone https://github.com/RuhaaBhalerao/MediBridge-AI.git
cd MediBridge-AI
```

**2. Install frontend dependencies**

```bash
npm install
```

**3. Install backend dependencies**

```bash
cd server
npm install
cd ..
```

**4. Configure environment variables**

Create a `.env` file in the root directory:

```env
VITE_API_URL=http://localhost:3001
```

Create a `.env` file inside the `server/` directory:

```env
PORT=3001
AI_API_KEY=your_api_key_here
```

### Running Locally

**Start the backend server:**

```bash
cd server
node index.js
```

**In a new terminal, start the frontend:**

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🌍 Deployment

The frontend is deployed on **https://medi-bridge-ai.vercel.app/**. To deploy your own instance:

1. Fork this repository
2. Import the project into Vercel
3. Set the environment variable `VITE_API_URL` to your hosted backend URL
4. Deploy the `server/` folder separately (e.g. Railway, Render, or Fly.io)

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, Vite, CSS |
| Backend | Node.js, Express |
| AI Integration | LLM API (OpenAI / compatible) |
| Deployment | Vercel (frontend) |
| Version Control | Git, GitHub |

---



##  Author

**Ruhaa Bhalerao**

[![GitHub](https://img.shields.io/badge/GitHub-RuhaaBhalerao-181717?style=flat-square&logo=github)](https://github.com/RuhaaBhalerao)

---

<div align="center">
  <sub>Built for accessible healthcare</sub>
</div>
