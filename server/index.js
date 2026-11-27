import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { GoogleGenAI } from "@google/genai";

const app = express();
const PORT = Number(process.env.PORT || 5000);
const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
  console.error("Missing GEMINI_API_KEY. Add it to server/.env.");
  process.exit(1);
}
const ai = new GoogleGenAI({ apiKey: API_KEY });
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_ORIGIN
    ? process.env.CLIENT_ORIGIN.split(",").map(x => x.trim())
    : ["http://localhost:5173"],
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"]
}));
app.use(express.json({ limit: "30kb" }));
app.use("/api/", rateLimit({
  windowMs: 60 * 1000, limit: 20, standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many requests. Please wait a moment and try again." }
}));
const SYSTEM_INSTRUCTION = `
You are JARVIS, a capable, concise, respectful personal AI assistant inspired by a
fictional cinematic AI. You are not the actual JARVIS from any film or a human.
Address the user naturally as "operator" only occasionally. Be helpful, accurate,
calm and lightly witty. If uncertain, say so. Never claim to have performed an
action on the user's device unless the application explicitly confirms it.
You cannot access local files, control the operating system, send messages, make
purchases, or operate hardware from this web app. You may explain how the user
can do those things safely. Format answers clearly and avoid unnecessary verbosity.
`;
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "JARVIS 2.0", model: MODEL, timestamp: new Date().toISOString() });
});
app.post("/api/chat", async (req, res) => {
  try {
    const message = typeof req.body?.message === "string" ? req.body.message.trim() : "";
    const history = Array.isArray(req.body?.history) ? req.body.history : [];
    if (!message) return res.status(400).json({ error: "Message cannot be empty." });
    if (message.length > 6000) return res.status(413).json({ error: "Message is too long. Limit: 6,000 characters." });
    const safeHistory = history.slice(-16).map(item => ({
      role: item?.role === "model" ? "model" : "user",
      parts: [{ text: String(item?.text || "").slice(0, 6000) }]
    })).filter(item => item.parts[0].text.trim());
    const result = await ai.models.generateContent({
      model: MODEL,
      contents: [...safeHistory, { role: "user", parts: [{ text: message }] }],
      config: { systemInstruction: SYSTEM_INSTRUCTION, temperature: 0.7, maxOutputTokens: 1200 }
    });
    const reply = result.text?.trim();
    if (!reply) return res.status(502).json({ error: "Gemini returned an empty response. Please retry." });
    res.json({ reply, model: MODEL });
  } catch (error) {
    console.error("Gemini request failed:", error?.message || error);
    res.status(500).json({ error: "JARVIS could not reach the AI service. Check the API key, model availability and server logs." });
  }
});
app.listen(PORT, () => console.log(`JARVIS backend online at http://localhost:${PORT}`));