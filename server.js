import express from "express";
import transcribeRouter from "./api/main.js";

const app = express();
app.use("/api", transcribeRouter);

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
