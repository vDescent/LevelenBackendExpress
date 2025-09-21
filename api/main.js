// main.js
import express from "express";
import multer from "multer";
import OpenAI from "openai";
import Levenshtein from "levenshtein";
import dotenv from "dotenv";
import { logStep } from "../utils/logger.js";
 
dotenv.config();
const router = express.Router();
const upload = multer(); // simpan file di memory
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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

router.post("/transcribe", upload.single("audio"), async (req, res) => {
    logStep("Mulai Proses /transcribe")
  try {
    logStep("Terima audio dari frontend")
    if (!req.file) return res.status(400).json({ error: "No audio file" });
    if (!req.body.question) return res.status(400).json({ error: "No question" });

    const audioBuffer = req.file.buffer;
    logStep("Kirimkan audio ke openai api")
    const result = await client.audio.translations.create({
      model: "whisper-1",
      file: new File([audioBuffer], "audio.mp3", { type: "audio/mpeg" }),
      prompt: "English only transcription"
    });

    const transcribed = result.text.trim();
    logStep("Terima transcribe dan cek similarity")
    // Hitung similarity
    const qNorm = normalizeText(req.body.question);
    const tNorm = normalizeText(transcribed);
    const similarity = new Levenshtein(qNorm, tNorm).distance;
    const similarityPercent = Math.round(((1 - similarity / Math.max(qNorm.length, tNorm.length)) * 100) * 100) / 100;
    const score = calculateScore(similarityPercent);
    logStep("Kirimkan hasil ke frontend")
    res.json({
      question: req.body.question,
      text: transcribed,
      similarity: similarityPercent,
      score
    });

  } catch (err) {
    logStep(`❌ Error: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

export default router;
