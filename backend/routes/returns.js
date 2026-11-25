const express = require("express");
const pool = require("../db");

const router = express.Router();

router.get("/", async (request, response) => {
  const q = request.query.q ?? "";

  if (typeof q !== "string") {
    return response.status(400).json({
      error: {
        code: "INVALID_QUERY",
        message: "Provide one search value for q.",
      },
    });
  }

  const searchText = q.trim();
  const escapedSearch = searchText.replace(/[\\%_]/g, (character) => "\\" + character);
  const searchPattern = `%${escapedSearch}%`;

  try {
    const result = await pool.query(
      `
        SELECT id, reference, customer_name, order_id, item_id,
               quantity, reason, status, created_at
        FROM public.return_requests
        WHERE removed_at IS NULL
          AND (
            customer_name ILIKE $1
            OR customer_email ILIKE $1
            OR order_id ILIKE $1
            OR reference ILIKE $1
          )
        ORDER BY created_at DESC, id DESC
        LIMIT 10
      `,
      [searchPattern],
    );

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