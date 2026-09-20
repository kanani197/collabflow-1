const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const datasetsRouter = require("./routes/datasets");
const collaborationRouter = require("./routes/collaboration");
const feedbackRouter = require("./routes/feedback");
const exportRouter = require("./routes/export");
const errorHandler = require("./middleware/errorHandler");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "CollabFlow API", time: new Date().toISOString() });
});

app.use("/api/datasets", datasetsRouter);
app.use("/api/collaboration", collaborationRouter);
app.use("/api/feedback", feedbackRouter);
app.use("/api/export", exportRouter);

app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.use(errorHandler);

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`CollabFlow API listening on port ${PORT}`);
  });
}

module.exports = app;
