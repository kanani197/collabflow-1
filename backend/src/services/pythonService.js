/**
 * pythonService.js
 * Spawns the Python analytics engine (analytics/analysis.py) as a child
 * process, passes it a dataset file path, and parses the JSON result it
 * prints to stdout. This is the only place the Node backend touches
 * statistics — per the architecture requirement, the backend never
 * calculates statistical results itself.
 */
const { spawn } = require("child_process");
const path = require("path");
const { getPythonBin } = require("../utils/pythonBin");

const PYTHON_BIN = getPythonBin();
const ANALYTICS_PATH =
  process.env.PYTHON_ANALYTICS_PATH || path.join(__dirname, "../../../analytics");

/**
 * Run analysis.py against a dataset file.
 * @param {string} filePath - absolute path to .xlsx/.csv file
 * @param {object} options - { eligible: boolean, label: string }
 * @returns {Promise<object>} parsed analytics JSON
 */
function runAnalysis(filePath, options = {}) {
  return new Promise((resolve, reject) => {
    const args = [path.join(ANALYTICS_PATH, "analysis.py"), filePath];
    if (options.eligible) args.push("--eligible");
    if (options.label) args.push("--label", options.label);

    const proc = spawn(PYTHON_BIN, args, { cwd: ANALYTICS_PATH });

    let stdout = "";
    let stderr = "";

    proc.stdout.on("data", (data) => {
      stdout += data.toString();
    });
    proc.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    proc.on("close", (code) => {
      if (code !== 0) {
        return reject(
          new Error(
            `Analytics engine exited with code ${code}. stderr: ${stderr || "(none)"}`
          )
        );
      }
      try {
        const parsed = JSON.parse(stdout);
        resolve(parsed);
      } catch (e) {
        reject(new Error(`Failed to parse analytics output as JSON: ${e.message}`));
      }
    });

    proc.on("error", (err) => {
      reject(new Error(`Failed to start Python analytics process: ${err.message}`));
    });
  });
}

module.exports = { runAnalysis };
