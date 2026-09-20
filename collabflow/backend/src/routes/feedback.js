/**
 * feedback.js
 * CollabFlow application self-feedback (NOT the dissertation dataset).
 * Lets users rate the CollabFlow app itself (ease of use, learning,
 * confidence, integration, satisfaction) on a 1-5 scale. Stored
 * in-memory for this MVP; kept clearly separate from dissertation
 * analytics throughout the UI.
 */
const express = require("express");
const router = express.Router();
const { v4: uuid } = require("uuid");

const feedbackEntries = [];

router.get("/", (req, res) => res.json(feedbackEntries));

router.post("/", (req, res) => {
  const { easeOfUse, easeOfLearning, confidence, integration, satisfaction, comment } = req.body;
  const values = [easeOfUse, easeOfLearning, confidence, integration, satisfaction];
  if (values.some((v) => typeof v !== "number" || v < 1 || v > 5)) {
    return res.status(400).json({ error: "All ratings must be numbers between 1 and 5." });
  }
  const entry = {
    id: uuid(),
    easeOfUse,
    easeOfLearning,
    confidence,
    integration,
    satisfaction,
    comment: comment || null,
    createdAt: new Date().toISOString(),
  };
  feedbackEntries.push(entry);
  res.status(201).json(entry);
});

router.get("/summary", (req, res) => {
  if (feedbackEntries.length === 0) {
    return res.json({ available: false, reason: "No feedback submitted yet." });
  }
  const avg = (key) =>
    Math.round(
      (feedbackEntries.reduce((sum, e) => sum + e[key], 0) / feedbackEntries.length) * 100
    ) / 100;
  res.json({
    available: true,
    n: feedbackEntries.length,
    averages: {
      easeOfUse: avg("easeOfUse"),
      easeOfLearning: avg("easeOfLearning"),
      confidence: avg("confidence"),
      integration: avg("integration"),
      satisfaction: avg("satisfaction"),
    },
  });
});

module.exports = router;
