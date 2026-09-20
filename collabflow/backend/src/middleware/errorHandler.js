function errorHandler(err, req, res, next) {
  console.error("[CollabFlow API Error]", err.message);

  if (err.message && err.message.includes("Unsupported file type")) {
    return res.status(400).json({ error: err.message });
  }
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({ error: "File exceeds the maximum allowed size." });
  }
  return res.status(500).json({
    error: "An unexpected error occurred while processing your request.",
    detail: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
}

module.exports = errorHandler;
