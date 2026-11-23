const express = require("express");
const cors = require("cors");
require("dotenv").config();

const { GoogleGenAI } = require("@google/genai");

const app = express();

app.use(cors());
app.use(express.json());

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

app.get("/", (req, res) => {
  res.json({
    message: "Voice Assistant Backend is running!",
  });
});

app.post("/api/chat", async (req, res) => {
  const startTime = Date.now();

  try {
    const { message } = req.body;

    console.log("📥 Request received:", message);

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash-lite",
      contents: message,
      config: {
  systemInstruction:
    "You are a voice assistant. Give concise, natural, conversational answers in 1 to 3 sentences. Do not use markdown, bullet points, headings, or long explanations unless the user explicitly asks for detail.",
  maxOutputTokens: 80,
  thinkingConfig: {
    thinkingLevel: "minimal",
  },
},
    });

    console.log(
      "🤖 Gemini response time:",
      Date.now() - startTime,
      "ms"
    );

    res.json({
      reply: response.text,
    });

  } catch (error) {
    console.error("Gemini error:", error);

    res.status(500).json({
      reply: "Sorry, I could not get a response from the AI.",
    });
  }
});

const PORT = 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});