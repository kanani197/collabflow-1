/**
 * collaboration.js
 * Lightweight collaboration workspace API (projects, teams, tasks,
 * requirements, meetings, notifications, messages). For this MVP stage
 * these are stored in-memory; database/schema.sql defines the full
 * PostgreSQL schema these endpoints would persist to in a production
 * build (see docs/architecture.md for the rationale).
 */
const express = require("express");
const router = express.Router();
const { v4: uuid } = require("uuid");

const db = {
  projects: [],
  teams: [],
  tasks: [],
  requirements: [],
  meetings: [],
  notifications: [],
  messages: [],
};

function crudRoutes(name, collection) {
  router.get(`/${name}`, (req, res) => res.json(db[collection]));
  router.post(`/${name}`, (req, res) => {
    const item = { id: uuid(), createdAt: new Date().toISOString(), ...req.body };
    db[collection].push(item);
    res.status(201).json(item);
  });
  router.patch(`/${name}/:id`, (req, res) => {
    const idx = db[collection].findIndex((i) => i.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: `${name} not found` });
    db[collection][idx] = { ...db[collection][idx], ...req.body };
    res.json(db[collection][idx]);
  });
  router.delete(`/${name}/:id`, (req, res) => {
    db[collection] = db[collection].filter((i) => i.id !== req.params.id);
    res.status(204).end();
  });
}

crudRoutes("projects", "projects");
crudRoutes("teams", "teams");
crudRoutes("tasks", "tasks");
crudRoutes("requirements", "requirements");
crudRoutes("meetings", "meetings");
crudRoutes("notifications", "notifications");
crudRoutes("messages", "messages");

/** GET /api/collaboration/search?q=... — global search across all entities */
router.get("/search", (req, res) => {
  const q = (req.query.q || "").toLowerCase().trim();
  if (!q) return res.json({ results: [] });

  const results = [];
  const searchable = [
    { type: "project", items: db.projects, fields: ["name", "description"] },
    { type: "task", items: db.tasks, fields: ["title", "description"] },
    { type: "requirement", items: db.requirements, fields: ["title", "description"] },
    { type: "meeting", items: db.meetings, fields: ["title", "agenda", "notes"] },
    { type: "message", items: db.messages, fields: ["content"] },
  ];
  for (const group of searchable) {
    for (const item of group.items) {
      const haystack = group.fields.map((f) => (item[f] || "")).join(" ").toLowerCase();
      if (haystack.includes(q)) {
        results.push({ type: group.type, id: item.id, item });
      }
    }
  }
  res.json({ results });
});

module.exports = router;
