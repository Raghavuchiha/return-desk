const express = require("express");
const pool = require("../db");

const router = express.Router();

router.get("/", async (request, response) => {
  try {
    const result = await pool.query(`
      SELECT id, reference, customer_name, order_id, item_id,
             quantity, reason, status, created_at
      FROM public.return_requests
      WHERE removed_at IS NULL
      ORDER BY created_at DESC, id DESC
      LIMIT 10
    `);

    response.json({ data: result.rows });
  } catch (error) {
    console.error("Could not list returns:", error.message);

    response.status(500).json({
      error: {
        code: "RETURNS_READ_FAILED",
        message: "Could not load returns.",
      },
    });
  }
});

module.exports = router;