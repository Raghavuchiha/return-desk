require("dotenv").config();
const returnsRouter = require("./routes/returns");

const express = require("express");
const pool = require("./db");

const app = express();
const port = process.env.PORT || 4000;

app.get("/api/health", async (request, response) => {
  try {
    const result = await pool.query(`
      SELECT COUNT(*)::integer AS visible_returns
      FROM public.return_requests
      WHERE removed_at IS NULL
    `);

    response.json({
      status: "ok",
      visibleReturns: result.rows[0].visible_returns,
    });
  } catch (error) {
    console.error("Database check failed:", error.message);
    response.status(503).json({
      error: {
        code: "DATABASE_UNAVAILABLE",
        message: "Could not read from the database.",
      },
    });
  }
});

app.use("/api/returns", returnsRouter);

app.listen(port, () => {
  console.log("ReturnDesk API running on port " + port);
});