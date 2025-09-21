// api/transcribe.js
import express from "express";
import multer from "multer";
import OpenAI from "openai";
import Levenshtein from "levenshtein";
import cors from "cors";

const app = express();
const upload = multer();
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.use(cors());
app.use(express.json());

function normalizeText(text) {
  return text.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function calculateScore(similarityPercent) {
  if (similarityPercent < 50) return 0;
  if (similarityPercent < 60) return 5;
  if (similarityPercent < 70) return 6;
  if (similarityPercent < 80) return 7;
  if (similarityPercent < 90) return 8;
  if (similarityPercent < 100) return 9;
  return 10;
}

app.post("/api/transcribe", upload.single("audio"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No audio file" });
    if (!req.body.question) return res.status(400).json({ error: "No question" });

    const audioBuffer = req.file.buffer;

    // 👉 di Node.js, jangan pakai new File()
    const result = await client.audio.transcriptions.create({
      model: "whisper-1",
      file: audioBuffer,
      prompt: "English only transcription",
    });

    const transcribed = result.text.trim();
    const qNorm = normalizeText(req.body.question);
    const tNorm = normalizeText(transcribed);
    const similarity = new Levenshtein(qNorm, tNorm).distance;
    const similarityPercent = Math.round(((1 - similarity / Math.max(qNorm.length, tNorm.length)) * 100) * 100) / 100;
    const score = calculateScore(similarityPercent);

    res.json({
      question: req.body.question,
      text: transcribed,
      similarity: similarityPercent,
      score,
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default app;
