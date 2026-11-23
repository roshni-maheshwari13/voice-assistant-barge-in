# 🎙️ Voice Assistant with Barge-In

A real-time AI voice assistant that allows users to speak naturally, receive AI-generated responses, and interrupt the assistant while it is speaking.

## 🚀 Features

- 🎤 Speech-to-Text using browser Speech Recognition
- 🤖 AI responses using Google Gemini
- 🔊 Text-to-Speech using browser Speech Synthesis
- ⚡ Real-time Barge-In support
- 🛑 Assistant speech stops when the user interrupts
- 💬 Conversation history
- 🧹 Clear conversation option
- 📱 Responsive UI
- 🔐 API key protected using environment variables

## 🏗️ Tech Stack

### Frontend
- React
- Vite
- JavaScript
- CSS
- Web Speech API

### Backend
- Node.js
- Express.js
- Google Gemini API
- CORS
- dotenv

## 📂 Project Structure

```text
voice-assisstant/
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   └── App.css
│   └── package.json
│
├── backend/
│   ├── server.js
│   ├── package.json
│   └── .env
│
├── .gitignore
└── README.md