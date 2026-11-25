const pool = require("../db");
const { ApiError, returnNotFound } = require("../middleware/errors");

const allowedTransitions = {
  Open: ["In Review"],
  "In Review": ["Approved", "Rejected"],
  Approved: ["Completed"],
  Rejected: [],
  Completed: [],
};

const editableStatuses = ["Open", "In Review"];
const removableStatuses = ["Open", "Rejected"];

async function withLockedReturn(id, action) {
  const client = await pool.connect();
  let releaseError;

  try {
    await client.query("BEGIN");

    const { rows } = await client.query(
      `SELECT *
       FROM public.return_requests
       WHERE id = $1 AND removed_at IS NULL
       FOR UPDATE`,
      [id],
    );

    if (!rows[0]) {
      throw returnNotFound();
    }

    const value = await action(client, rows[0]);
    await client.query("COMMIT");
    return value;
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch (rollbackError) {
      releaseError = rollbackError;
    }

    throw error;
  } finally {
    client.release(releaseError);
  }
}

async function listReturns({ search, status, reason, sort, page, pageSize }) {
  const conditions = ["removed_at IS NULL"];
  const values = [];

  if (search) {
    const escaped = search.replace(/[\\%_]/g, (character) => "\\" + character);
    values.push(`%${escaped}%`);
    const parameter = `$${values.length}`;

    conditions.push(`(
      customer_name ILIKE ${parameter}
      OR customer_email ILIKE ${parameter}
      OR order_id ILIKE ${parameter}
      OR reference ILIKE ${parameter}
    )`);
  }

  if (status) {
    values.push(status);
    conditions.push(`status = $${values.length}`);
  }

  if (reason) {
    values.push(reason);
    conditions.push(`reason = $${values.length}`);
  }

  const direction = sort === "oldest" ? "ASC" : "DESC";
  const orderBy = `created_at ${direction}, id ${direction}`;
  const limit = `$${values.length + 1}`;
  const offset = `$${values.length + 2}`;

  const { rows } = await pool.query(
    `WITH matching_returns AS (
       SELECT id, reference, customer_name, order_id, item_id,
              quantity, reason, status, created_at
       FROM public.return_requests
       WHERE ${conditions.join(" AND ")}
     ),
     page_rows AS (
       SELECT *
       FROM matching_returns
       ORDER BY ${orderBy}
       LIMIT ${limit} OFFSET ${offset}
     )
     SELECT
       (SELECT COUNT(*) FROM matching_returns) AS total,
       COALESCE(json_agg(page_rows ORDER BY ${orderBy}), '[]'::json) AS data
     FROM page_rows`,
    [...values, pageSize, (page - 1) * pageSize],
  );

  const total = Number(rows[0].total);

  return {
    data: rows[0].data,
    pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
  };
}

async function createReturn(details) {
  const { rows } = await pool.query(
    `INSERT INTO public.return_requests
       (customer_name, customer_email, order_id, item_id, quantity, reason)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [
      details.customer_name,
      details.customer_email,
      details.order_id,
      details.item_id,
      details.quantity,
      details.reason,
    ],
  );

  return rows[0];
}

async function getReturn(id) {
  const { rows } = await pool.query(
    `SELECT r.*,
       COALESCE(
         (SELECT json_agg(n ORDER BY n.created_at, n.id)
          FROM public.request_notes n
          WHERE n.request_id = r.id),
         '[]'::json
       ) AS notes
     FROM public.return_requests r
     WHERE r.id = $1 AND r.removed_at IS NULL`,
    [id],
  );

  if (!rows[0]) {
    throw returnNotFound();
  }

  return rows[0];
}

async function updateReturn(id, changes) {
  return withLockedReturn(id, async (client, current) => {
    if (!editableStatuses.includes(current.status)) {
      throw new ApiError(409, "RETURN_LOCKED", "This return has already been decided.");
    }

    // validateDetails allows only the six known field names.
    const fields = Object.keys(changes);
    const assignments = fields.map((field, index) => `${field} = $${index + 2}`);

    const { rows } = await client.query(
      `UPDATE public.return_requests
       SET ${assignments.join(", ")}
       WHERE id = $1
       RETURNING *`,
      [id, ...fields.map((field) => changes[field])],
    );

    return rows[0];
  });
}

async function transitionReturn(id, { status, resolution, refundAmount }) {
  return withLockedReturn(id, async (client, current) => {
    if (!allowedTransitions[current.status].includes(status)) {
      throw new ApiError(
        409,
        "INVALID_TRANSITION",
        `Cannot move a return from ${current.status} to ${status}.`,
      );
    }

    const approving = status === "Approved";

    const { rows } = await client.query(
      `UPDATE public.return_requests
       SET status = $2, resolution = $3, refund_amount = $4
       WHERE id = $1
       RETURNING *`,
      [
        id,
        status,
        approving ? resolution : current.resolution,
        approving ? refundAmount : current.refund_amount,
      ],
    );

    return rows[0];
  });
}

async function addNote(id, body) {
  return withLockedReturn(id, async (client) => {
    const { rows } = await client.query(
      `INSERT INTO public.request_notes (request_id, body)
       VALUES ($1, $2)
       RETURNING *`,
      [id, body],
    );

    return rows[0];
  });
}

async function removeReturn(id) {
  await withLockedReturn(id, async (client, current) => {
    if (!removableStatuses.includes(current.status)) {
      throw new ApiError(409, "REMOVAL_NOT_ALLOWED", "Only Open or Rejected returns can be removed.");
    }

    await client.query(
      `UPDATE public.return_requests
       SET removed_at = NOW()
       WHERE id = $1`,
      [id],
    );
  });
}

module.exports = {
  listReturns,
  createReturn,
  getReturn,
  updateReturn,
  transitionReturn,
  addNote,
  removeReturn,
};