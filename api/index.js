import express from 'express'

const express = require("express");
const app = express();

app.get("/", (req, res) => {
  res.send("Hello World from Express on Vercel!");
});

module.exports = app; // penting untuk vercel
