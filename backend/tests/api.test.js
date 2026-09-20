const request = require("supertest");
const path = require("path");
const app = require("../src/server");

describe("CollabFlow API", () => {
  test("GET /api/health returns ok", async () => {
    const res = await request(app).get("/api/health");
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe("ok");
  });

  test("GET /api/datasets/current returns dissertation dataset by default", async () => {
    const res = await request(app).get("/api/datasets/current").set("X-Session-Id", "jest-1");
    expect(res.statusCode).toBe(200);
    expect(res.body.label).toBe("Dissertation Dataset");
    expect(res.body.rows).toBe(84);
    expect(res.body.columns).toBe(19);
  });

  test("GET /api/datasets/analyze reproduces dissertation KPIs", async () => {
    const res = await request(app)
      .get("/api/datasets/analyze?eligible=false")
      .set("X-Session-Id", "jest-2");
    expect(res.statusCode).toBe(200);
    expect(res.body.sample.n_used).toBe(84);
    expect(Math.abs(res.body.kpis.ux_mean - 2.8)).toBeLessThan(0.06);
    expect(Math.abs(res.body.kpis.coordination_mean - 2.59)).toBeLessThan(0.06);
  }, 15000);

  test("GET /api/datasets/analyze with eligible=true filters to N=61", async () => {
    const res = await request(app)
      .get("/api/datasets/analyze?eligible=true")
      .set("X-Session-Id", "jest-3");
    expect(res.statusCode).toBe(200);
    expect(res.body.sample.n_used).toBe(61);
    expect(res.body.sample.excluded_by_eligibility).toBe(23);
  }, 15000);

  test("POST /api/datasets/reset restores the default dataset", async () => {
    const res = await request(app).post("/api/datasets/reset").set("X-Session-Id", "jest-4");
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toMatch(/reset/i);
  });

  test("POST /api/datasets/upload rejects unsupported file types", async () => {
    const res = await request(app)
      .post("/api/datasets/upload")
      .set("X-Session-Id", "jest-5")
      .attach("file", Buffer.from("not a spreadsheet"), "notes.txt");
    expect(res.statusCode).toBe(400);
  });

  test("Collaboration: create and list a task", async () => {
    const create = await request(app)
      .post("/api/collaboration/tasks")
      .send({ title: "Test task", status: "To Do", priority: "Normal" });
    expect(create.statusCode).toBe(201);
    expect(create.body.title).toBe("Test task");

    const list = await request(app).get("/api/collaboration/tasks");
    expect(list.statusCode).toBe(200);
    expect(list.body.some((t) => t.title === "Test task")).toBe(true);
  });

  test("Feedback: rejects out-of-range ratings", async () => {
    const res = await request(app).post("/api/feedback").send({
      easeOfUse: 6, easeOfLearning: 3, confidence: 3, integration: 3, satisfaction: 3,
    });
    expect(res.statusCode).toBe(400);
  });

  test("Feedback: accepts valid ratings", async () => {
    const res = await request(app).post("/api/feedback").send({
      easeOfUse: 4, easeOfLearning: 5, confidence: 4, integration: 3, satisfaction: 4,
    });
    expect(res.statusCode).toBe(201);
  });

  test("GET /api/export/cleaned-csv returns a CSV with the dissertation row count", async () => {
    const res = await request(app)
      .get("/api/export/cleaned-csv?eligible=false")
      .set("X-Session-Id", "jest-csv");
    expect(res.statusCode).toBe(200);
    expect(res.headers["content-type"]).toMatch(/text\/csv/);
    const lines = res.text.trim().split("\n");
    expect(lines.length).toBe(85); // header + 84 rows
  }, 15000);

  test("GET /api/export/report returns a text report with key sections", async () => {
    const res = await request(app)
      .get("/api/export/report?eligible=false")
      .set("X-Session-Id", "jest-report");
    expect(res.statusCode).toBe(200);
    expect(res.text).toMatch(/COLLABFLOW — ANALYSIS REPORT/);
    expect(res.text).toMatch(/DEMOGRAPHICS/);
    expect(res.text).toMatch(/CORRELATION ANALYSIS/);
    expect(res.text).toMatch(/LIMITATIONS/);
  }, 15000);
});
