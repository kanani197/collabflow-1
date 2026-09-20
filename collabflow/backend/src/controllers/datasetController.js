const path = require("path");
const { spawn } = require("child_process");
const { runAnalysis } = require("../services/pythonService");
const { getPythonBin } = require("../utils/pythonBin");
const {
  DEFAULT_SESSION_ID,
  DEFAULT_DATASET_PATH,
  getSession,
  setSession,
  resetToDefault,
} = require("../services/sessionStore");

const PYTHON_BIN = getPythonBin();
const ANALYTICS_PATH =
  process.env.PYTHON_ANALYTICS_PATH || path.join(__dirname, "../../../analytics");

function getSessionId(req) {
  return req.headers["x-session-id"] || DEFAULT_SESSION_ID;
}

/** POST /api/datasets/upload */
async function uploadDataset(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file was uploaded." });
    }
    const sessionId = getSessionId(req);
    const filePath = req.file.path;

    const preview = await runPreview(filePath);
    if (preview.error) {
      return res.status(400).json({ error: preview.error });
    }

    setSession(sessionId, {
      filePath,
      label: req.file.originalname,
      isDefault: false,
      mapping: preview.mapping,
    });

    return res.json({
      file: req.file.originalname,
      rows: preview.row_count,
      columns: preview.column_count,
      validation: preview.validation,
      mapping: preview.mapping,
      isDissertationFile: preview.is_dissertation_file,
      sessionId,
    });
  } catch (err) {
    next(err);
  }
}

/** POST /api/datasets/reset */
function resetDataset(req, res) {
  const sessionId = getSessionId(req);
  resetToDefault(sessionId);
  return res.json({ message: "Dataset reset to Dissertation Dataset.", sessionId });
}

/** GET /api/datasets/current */
async function getCurrentDatasetInfo(req, res, next) {
  try {
    const sessionId = getSessionId(req);
    const session = getSession(sessionId);
    const preview = await runPreview(session.filePath);
    return res.json({
      label: session.label,
      isDefault: session.isDefault,
      rows: preview.row_count,
      columns: preview.column_count,
      validation: preview.validation,
      mapping: session.mapping || preview.mapping,
    });
  } catch (err) {
    next(err);
  }
}

/** POST /api/datasets/mapping  body: { mapping: {...} } */
function saveMapping(req, res) {
  const sessionId = getSessionId(req);
  const session = getSession(sessionId);
  const { mapping } = req.body;
  if (!mapping) return res.status(400).json({ error: "mapping is required" });
  setSession(sessionId, { ...session, mapping });
  return res.json({ message: "Mapping saved for this session.", sessionId });
}

/** GET /api/datasets/analyze?eligible=true */
async function analyzeDataset(req, res, next) {
  try {
    const sessionId = getSessionId(req);
    const session = getSession(sessionId);
    const eligible = req.query.eligible === "true";

    const result = await runAnalysis(session.filePath, {
      eligible,
      label: session.label,
    });
    return res.json(result);
  } catch (err) {
    next(err);
  }
}

function runPreview(filePath) {
  return new Promise((resolve, reject) => {
    const proc = spawn(PYTHON_BIN, [path.join(ANALYTICS_PATH, "preview.py"), filePath], {
      cwd: ANALYTICS_PATH,
    });
    let stdout = "";
    let stderr = "";
    proc.stdout.on("data", (d) => (stdout += d.toString()));
    proc.stderr.on("data", (d) => (stderr += d.toString()));
    proc.on("close", (code) => {
      try {
        resolve(JSON.parse(stdout));
      } catch (e) {
        reject(new Error(`Preview failed (exit ${code}): ${stderr || stdout}`));
      }
    });
    proc.on("error", (err) => reject(err));
  });
}

module.exports = {
  uploadDataset,
  resetDataset,
  getCurrentDatasetInfo,
  saveMapping,
  analyzeDataset,
};
