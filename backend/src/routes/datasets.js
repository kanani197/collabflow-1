const express = require("express");
const router = express.Router();
const { upload } = require("../middleware/upload");
const ctrl = require("../controllers/datasetController");

router.post("/upload", upload.single("file"), ctrl.uploadDataset);
router.post("/reset", ctrl.resetDataset);
router.get("/current", ctrl.getCurrentDatasetInfo);
router.post("/mapping", ctrl.saveMapping);
router.get("/analyze", ctrl.analyzeDataset);

module.exports = router;
