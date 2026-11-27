# JARVIS 2.0 — Personal AI Command Centre

A responsive, Iron Man-inspired AI assistant interface powered by Google's Gemini API.

## Features
- Gemini-powered chat through a private Express backend
- Browser speech-to-text input (where supported)
- Browser text-to-speech output
- Animated holographic JARVIS core
- Local conversation history
- Quick browser commands for common websites and utilities
- Browser connectivity, clock and battery diagnostics where supported
- Responsive desktop and mobile layout

## Requirements
- Node.js 20+ (Node.js 22+ recommended)
- npm
- Gemini API key: https://aistudio.google.com/apikey
- Chrome or Edge recommended for speech recognition

## Local setup

### 1. Backend
```bash
cd server
npm install
```
Copy `.env.example` to `.env` and configure:
```env
GEMINI_API_KEY=your_actual_key
GEMINI_MODEL=gemini-2.5-flash
PORT=5000
CLIENT_ORIGIN=http://localhost:5173
```
Never commit `.env` or expose the API key in frontend code.

Start the backend:
```bash
npm run dev
``
Health check: http://localhost:5000/api/health

### 2. Frontend
In a second terminal:
```bash
cd client
npm install
npm run dev
``
Open the Vite URL, normally http://localhost:5173.

## Deployment

### Backend — Render
- Create a new **Web Service** from this repository.
- Root Directory: `server`
- Build Command: `npm install`
- Start Command: `npm start`
- Add environment variables `GEMINI_API_KEY`, `GEMINI_MODEL`, `CLIENT_ORIGIN`.
- Set `CLIENT_ORIGIN` to the deployed frontend origin (for example, your Vercel URL).
- Keep the Gemini key in Render's server environment only.

### Frontend — Vercel
- Import this repository into Vercel.
- Root Directory: `client`
- Framework: Vite
- Build Command: `npm run build`
- Output Directory: `dist`
- Add `VITE_API_URL` with the deployed backend base URL (no trailing slash).

After deploying, verify the backend at `/api/health` and test a chat request from the frontend.

## Security and limitations
This is an educational starter project, not a production-hardened personal agent.
- Keep the Gemini key server-side.
- Use HTTPS and restrict CORS to the deployed frontend domain.
- Add authentication, monitoring and stronger abuse protection before public launch.
- Never execute arbitrary shell commands suggested by an AI response.
- Speech recognition is browser-dependent and requires permission.
- Chat history is stored in localStorage on the current browser; it is not synced.

## Project structure
```text
Jarvis/
├── client/
│   ├── index.html
│   ├── package.json
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       └── style.css
├── server/
│   ├── index.js
│   ├── package.json
│   └── .env.example
├── .gitignore
└── README.md
```

## License
Use and modify for personal and educational projects. Review third-party package and service terms before commercial use.
