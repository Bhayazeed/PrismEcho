# 🎙️ SpeakBox

> **A spatial audio debate platform where voices become ideas.**

![Tech Stack](https://img.shields.io/badge/React-19-blue?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?style=flat-square&logo=typescript)
![FastAPI](https://img.shields.io/badge/FastAPI-Latest-green?style=flat-square&logo=fastapi)
![Gemini](https://img.shields.io/badge/Gemini_AI-3_Flash-orange?style=flat-square&logo=google)

---

## 💡 The Problem

Traditional online debates are **chaotic**. Comments get buried, conversations spiral into noise, and meaningful discourse gets lost in the clutter. Text-based platforms strip away the nuance of human voice—the passion, the hesitation, the conviction that makes arguments compelling.

## 🎯 The Solution

**SpeakBox** reimagines debate as a **spatial experience**. Instead of endless scrolling through text, participants navigate a visual canvas where each voice recording becomes a **node**—connected, organized, and alive.

Imagine walking into a room where ideas float in space. You can see how arguments connect, branch off, and respond to each other. Every voice is preserved, summarized by AI, and placed in its rightful context within the larger conversation.

## 🔮 How It Works

1. **Create or Join a Room** — Pick a topic like "Should AI be regulated?" or create your own debate space with a custom topic.

2. **Record Your Voice** — Instead of typing, speak your argument. Your voice carries weight that text simply cannot.

3. **AI-Powered Processing** — Gemini AI listens to your recording and extracts the key argument into concise bullet points. No transcription dumps—just the essence of what you said.

4. **Spatial Visualization** — Your contribution appears as a node on the canvas, connected to the argument you're responding to. Watch the debate grow organically as a visual tree of ideas.

5. **Content Moderation** — AI ensures discussions remain productive. Hate speech, harassment, and toxic content are filtered before they can poison the conversation.

## 🌟 What Makes SpeakBox Unique

| Feature | Why It Matters |
|---------|----------------|
| **Voice-First** | Captures emotion, nuance, and authenticity that text lacks |
| **Spatial Canvas** | Visualize debate structure—see how ideas connect and evolve |
| **AI Summarization** | Gemini distills recordings into key points, making debates scannable |
| **Real-Time Sync** | WebSocket-powered live updates—see contributions as they happen |
| **Neo-Brutalist Design** | Bold, unapologetic aesthetics that match the intensity of debate |

---

## ✨ Features

- 🗣️ **Spatial Audio Canvas** - Visualize debates as interconnected nodes in a spatial interface
- 🤖 **AI Moderation** - Real-time content moderation powered by Gemini AI
- 🎧 **Voice Transcription** - Upload audio and get AI-generated summaries
- 🚀 **Real-time WebSocket** - Live updates with WebSocket connections
- 🎨 **Neo-Brutalist Design** - Bold, striking visual identity
- 📱 **Responsive UI** - Works seamlessly across devices

---

## 🏗️ Project Structure

```
PrismEcho/
├── backend/                  # Python FastAPI backend
│   ├── main.py              # FastAPI app & endpoints
│   ├── managers/            # WebSocket connection manager
│   ├── services/            # AI services (LLM, moderation)
│   └── requirements.txt     # Python dependencies
│
├── frontend/                 # React + TypeScript frontend
│   ├── src/
│   │   ├── components/      # React components
│   │   │   ├── SpatialCanvas.tsx   # Main spatial UI
│   │   │   ├── Lobby.tsx           # Room lobby
│   │   │   ├── ReplyModal.tsx      # Reply interface
│   │   │   └── CreateRoomModal.tsx # Room creation
│   │   ├── hooks/           # Custom React hooks
│   │   ├── App.tsx          # Root component
│   │   └── index.css        # Global styles
│   └── package.json
│
└── package.json              # Root dependencies
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** >= 18.x
- **Python** >= 3.10
- **Gemini API Key** (for AI features)

### Backend Setup

```bash
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv

# Activate venv (Windows)
.\venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
echo "GEMINI_API_KEY=your_api_key_here" > .env

# Run the server
python main.py
```

Backend will run at `http://localhost:8000`

### Frontend Setup

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend will run at `http://localhost:5173`

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | Health check |
| `GET` | `/api/rooms` | List all rooms |
| `POST` | `/api/rooms/create` | Create a new room |
| `GET` | `/api/rooms/{room_id}` | Get room details |
| `POST` | `/api/moderate` | Content moderation check |
| `POST` | `/api/audio/upload` | Upload & transcribe audio |
| `WS` | `/ws/{client_id}` | WebSocket connection |

---

## 🛠️ Tech Stack

### Frontend
- **React 19** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS 4** - Styling
- **Framer Motion** - Animations
- **Zustand** - State management
- **Vite** - Build tool

### Backend
- **FastAPI** - Async API framework
- **Uvicorn** - ASGI server
- **Google Generative AI** - Gemini API
- **WebSockets** - Real-time communication
- **Pydantic** - Data validation

---

## 🎨 Design System

PrismEcho uses a **Neo-Brutalist** design language:

- Bold black borders (`border-brutal`)
- Hard offset shadows (`shadow-brutal`)
- Vibrant accent colors (green, pink, yellow, blue)
- Cream background with grid pattern
- Space Grotesk typography


---

## 📄 License

This project is for educational and portfolio purposes.

---

## 👤 Author

**100% vibe coded** 🎵✨ — No detailed planning, just vibes, coffee, and letting the code flow.

Built with ❤️, lots of ☕, good music, and AI as my pair programmer.

---

<p align="center">
  <strong>SpeakBox</strong> — Where every voice echoes.
  <br/>
  <sub>✨ Vibe coded with love ✨</sub>
</p>
