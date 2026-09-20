/**
 * pythonBin.js
 * Resolves which Python executable to invoke. Respects an explicit
 * PYTHON_BIN env var if set; otherwise defaults to "python" on Windows
 * (where "python3" typically does not exist, or resolves to the
 * Microsoft Store stub) and "python3" everywhere else.
 */
function getPythonBin() {
  if (process.env.PYTHON_BIN) return process.env.PYTHON_BIN;
  return process.platform === "win32" ? "python" : "python3";
}

module.exports = { getPythonBin };
