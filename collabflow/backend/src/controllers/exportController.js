const path = require("path");
const { spawn } = require("child_process");
const { getSession, DEFAULT_SESSION_ID } = require("../services/sessionStore");
const { runAnalysis } = require("../services/pythonService");
const { getPythonBin } = require("../utils/pythonBin");

function getSessionId(req) {
  return req.headers["x-session-id"] || DEFAULT_SESSION_ID;
}

/** GET /api/export/cleaned-csv?eligible=true|false */
async function exportCleanedCsv(req, res, next) {
  try {
    const sessionId = getSessionId(req);
    const session = getSession(sessionId);
    const eligible = req.query.eligible === "true";

    const csv = await runCsvExport(session.filePath, eligible);
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="cleaned_dataset.csv"`);
    res.send(csv);
  } catch (err) {
    next(err);
  }
}

/** GET /api/export/report?eligible=true|false — plain-text analysis report */
async function exportReport(req, res, next) {
  try {
    const sessionId = getSessionId(req);
    const session = getSession(sessionId);
    const eligible = req.query.eligible === "true";

    const result = await runAnalysis(session.filePath, { eligible, label: session.label });
    const report = buildTextReport(result);

    res.setHeader("Content-Type", "text/plain");
    res.setHeader("Content-Disposition", `attachment; filename="collabflow_analysis_report.txt"`);
    res.send(report);
  } catch (err) {
    next(err);
  }
}

function runCsvExport(filePath, eligible) {
  return new Promise((resolve, reject) => {
    const analyticsPath =
      process.env.PYTHON_ANALYTICS_PATH || path.join(__dirname, "../../../analytics");
    const pythonBin = getPythonBin();
    const args = [path.join(analyticsPath, "export_csv.py"), filePath];
    if (eligible) args.push("--eligible");

    const proc = spawn(pythonBin, args, { cwd: analyticsPath });
    let stdout = "";
    let stderr = "";
    proc.stdout.on("data", (d) => (stdout += d.toString()));
    proc.stderr.on("data", (d) => (stderr += d.toString()));
    proc.on("close", (code) => {
      if (code !== 0) return reject(new Error(`CSV export failed: ${stderr}`));
      resolve(stdout);
    });
    proc.on("error", reject);
  });
}

function buildTextReport(r) {
  const lines = [];
  const add = (s = "") => lines.push(s);

  add("=".repeat(70));
  add("COLLABFLOW — ANALYSIS REPORT");
  add(`Dataset analysed: ${r.dataset_label}`);
  add(`This report is generated from the currently selected dataset.`);
  add("=".repeat(70));

  add("\n1. DATASET OVERVIEW");
  add(`Rows used: ${r.sample.n_used} (of ${r.sample.n_total_uploaded} uploaded)`);
  add(`Eligibility filter applied: ${r.sample.eligible_filter_applied}`);
  add(`Excluded by eligibility rule: ${r.sample.excluded_by_eligibility}`);

  add("\n2. DATA QUALITY");
  r.validation.checks.forEach((c) => add(`  [${c.status}] ${c.label}`));
  r.validation.warnings.forEach((w) => add(`  WARNING: ${w}`));

  add("\n3. DEMOGRAPHICS");
  for (const [key, summary] of Object.entries(r.demographics)) {
    add(`  ${key}:`);
    if (summary.available) {
      summary.categories.forEach((c) => add(`    ${c.label}: ${c.count} (${c.pct}%)`));
    } else {
      add(`    Not available: ${summary.reason}`);
    }
  }

  add("\n4. TOOL USAGE");
  if (r.tool_usage.summary.available) {
    r.tool_usage.summary.categories.forEach((c) => add(`  ${c.label}: ${c.count} (${c.pct}%)`));
  }

  add("\n5-8. CONSTRUCT COMPOSITES (UX, Communication, Coordination, Performance)");
  for (const [key, c] of Object.entries(r.constructs)) {
    if (c.available) {
      add(`  ${key}: mean=${c.composite_stats.mean}, sd=${c.composite_stats.sd}, n=${c.composite_stats.n}`);
    } else {
      add(`  ${key}: not available (${c.reason})`);
    }
  }

  add("\n9. RELIABILITY (Cronbach's alpha)");
  for (const [key, rel] of Object.entries(r.reliability)) {
    add(rel.available
      ? `  ${key}: alpha=${rel.alpha} — ${rel.interpretation}`
      : `  ${key}: not available (${rel.reason})`);
  }

  add("\n10. NORMALITY (Shapiro-Wilk)");
  for (const [key, n] of Object.entries(r.normality)) {
    add(n.available ? `  ${key}: W=${n.W}, p=${n.p}, normal=${n.normal}` : `  ${key}: not available`);
  }

  add("\n11. CORRELATION ANALYSIS");
  r.correlations.filter((c) => c.available).forEach((c) => {
    add(`  ${c.variable_a} <-> ${c.variable_b}: ${c.primary_method} = ${c.coefficient}, p=${c.p_value} (${c.significant ? "significant" : "not significant"})`);
  });

  add("\n12. GROUP COMPARISON (Technical vs Non-Technical)");
  for (const [key, v] of Object.entries(r.technical_vs_nontechnical)) {
    if (v && v.available) {
      add(`  ${key}: Welch t=${v.welch_t}, p=${v.welch_p} (${v.welch_significant ? "significant" : "not significant"})`);
    }
  }

  add("\n13. TOOL COMPARISON (Kruskal-Wallis)");
  for (const [key, v] of Object.entries(r.tool_comparison)) {
    if (v && v.available) {
      add(`  ${key}: H=${v.H}, df=${v.df}, p=${v.p} (${v.significant ? "significant" : "not significant"})`);
    }
  }

  add("\n14. OPEN FEEDBACK");
  if (r.open_text.available) {
    add(`  Responses received: ${r.open_text.responses_received} of ${r.open_text.total_rows}`);
    add(`  Usable responses: ${r.open_text.usable_responses}`);
  }

  add("\n15. INTERVIEW INSIGHTS");
  if (r.interview.available) {
    add(`  Participant: ${r.interview.participant.label} (${r.interview.participant.role})`);
    r.interview.themes.forEach((t) => add(`    - ${t.title}`));
    add(`  ${r.interview.caveat}`);
  } else {
    add(`  ${r.interview.reason}`);
  }

  add("\n16. KEY FINDINGS");
  r.insights.forEach((i) => add(`  [${i.type}] ${i.text}`));

  add("\n17. EVIDENCE-INFORMED RECOMMENDATIONS");
  r.recommendations.forEach((rec) => add(`  [${rec.label}] ${rec.text}`));

  add("\n18. LIMITATIONS");
  add("  - Statistical associations reported here do not imply causation.");
  add("  - Composite reliability should be checked (see section 9) before drawing conclusions.");
  add("  - Interview/qualitative content, where present, reflects a single participant and is not generalisable.");

  return lines.join("\n");
}

module.exports = { exportCleanedCsv, exportReport };
