const express = require("express");
const router = express.Router();
const { exportCleanedCsv, exportReport } = require("../controllers/exportController");

router.get("/cleaned-csv", exportCleanedCsv);
router.get("/report", exportReport);

module.exports = router;
