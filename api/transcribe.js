import express from "express";
import multer from "multer";
import OpenAI from "openai";
import levenshtein from "fast-levenshtein"; // ganti biar aman di ESM

const app = express();
const upload = multer();
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function normalizeText(text) {
  return text.toLowerCase().replace(/[^a-z0-9]/g, "");
}
function calculateScore(p) {
  if (p < 50) return 0;
  if (p < 60) return 5;
  if (p < 70) return 6;
  if (p < 80) return 7;
  if (p < 90) return 8;
  if (p < 100) return 9;
  return 10;
}

app.post("/", upload.single("audio"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No audio file" });
    if (!req.body.question) return res.status(400).json({ error: "No question" });

    const result = await client.audio.transcriptions.create({
      model: "whisper-1",
      file: req.file.buffer,
      prompt: "English only transcription"
    });

    const transcribed = result.text.trim();
    const qNorm = normalizeText(req.body.question);
    const tNorm = normalizeText(transcribed);

    const distance = levenshtein.get(qNorm, tNorm);
    const similarityPercent = Math.round(
      ((1 - distance / Math.max(qNorm.length, tNorm.length)) * 100) * 100
    ) / 100;

    const score = calculateScore(similarityPercent);

    res.json({
      question: req.body.question,
      text: transcribed,
      similarity: similarityPercent,
      score
    });
  } catch (err) {
    console.error("❌ Server error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default app;
