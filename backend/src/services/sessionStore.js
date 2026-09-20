/**
 * sessionStore.js
 * Minimal in-memory session/dataset registry for the analytics MVP.
 *
 * Architecture note (see docs/architecture.md): uploaded spreadsheet
 * files are processed directly by the Python analytics engine rather
 * than being row-by-row duplicated into PostgreSQL. PostgreSQL (see
 * database/schema.sql) is used for durable application entities
 * (users, projects, tasks, requirements, meetings, analysis run
 * metadata) - not as a copy of every uploaded spreadsheet cell. This
 * keeps upload -> analyse fast and avoids an unnecessary ETL step for
 * data that is only needed transiently to compute statistics.
 *
 * This in-memory store stands in for a `sessions` table so the MVP
 * runs without requiring a live Postgres instance. Swapping it for a
 * real table is a drop-in change (see database/schema.sql
 * `analysis_runs`).
 */
const path = require("path");

const DEFAULT_DATASET_PATH =
  process.env.DEFAULT_DATASET_PATH ||
  path.join(__dirname, "../../../data/default/dissertation_dataset.xlsx");

// sessionId -> { filePath, label, isDefault, mapping, uploadedAt }
const sessions = new Map();

const DEFAULT_SESSION_ID = "default";

function initDefaultSession() {
  sessions.set(DEFAULT_SESSION_ID, {
    filePath: DEFAULT_DATASET_PATH,
    label: "Dissertation Dataset",
    isDefault: true,
    mapping: null,
    uploadedAt: new Date().toISOString(),
  });
}
initDefaultSession();

function getSession(sessionId) {
  return sessions.get(sessionId) || sessions.get(DEFAULT_SESSION_ID);
}

function setSession(sessionId, data) {
  sessions.set(sessionId, { ...data, uploadedAt: new Date().toISOString() });
}

function resetToDefault(sessionId) {
  sessions.set(sessionId, { ...sessions.get(DEFAULT_SESSION_ID) });
}

function deleteSession(sessionId) {
  if (sessionId !== DEFAULT_SESSION_ID) sessions.delete(sessionId);
}

module.exports = {
  DEFAULT_SESSION_ID,
  DEFAULT_DATASET_PATH,
  getSession,
  setSession,
  resetToDefault,
  deleteSession,
};
