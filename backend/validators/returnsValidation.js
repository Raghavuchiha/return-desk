const { invalidInput, invalidQuery } = require("../middleware/errors");

const statuses = ["Open", "In Review", "Approved", "Rejected", "Completed"];
const reasons = ["Damaged", "Wrong Item", "Size Issue", "Not As Described", "Changed Mind"];
const resolutions = ["Refund", "Replacement", "Store Credit"];
const maxInteger = 2147483647;

function validateId(value) {
  const id = Number(value);

  if (!/^[1-9]\d*$/.test(value) || !Number.isInteger(id) || id > maxInteger) {
    throw invalidInput("Return ID must be a valid positive integer.");
  }

  return id;
}

function requireObject(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw invalidInput("Send a JSON object in the request body.");
  }

  return body;
}

function readText(value, label, maxLength) {
  if (typeof value !== "string" || !value.trim()) {
    throw invalidInput(`${label} is required.`);
  }

  const text = value.trim();

  if (text.length > maxLength || text.includes("\0")) {
    throw invalidInput(`${label} must be valid text up to ${maxLength} characters.`);
  }

  return text;
}

const detailFields = {
  customer_name: (value) => readText(value, "Customer name", 100),
  customer_email: (value) => {
    const email = readText(value, "Customer email", 255);

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw invalidInput("Enter a valid customer email.");
    }

    return email;
  },
  order_id: (value) => readText(value, "Order ID", 50),
  item_id: (value) => readText(value, "Item ID", 50),
  quantity: (value) => {
    if (!Number.isInteger(value) || value < 1 || value > maxInteger) {
      throw invalidInput("Quantity must be a positive whole number.");
    }

    return value;
  },
  reason: (value) => {
    if (!reasons.includes(value)) {
      throw invalidInput("Choose a valid return reason.");
    }

    return value;
  },
};

function validateDetails(body, partial = false) {
  requireObject(body);

  for (const field of Object.keys(body)) {
    if (!Object.hasOwn(detailFields, field)) {
      throw invalidInput(`Unexpected field: ${field}.`);
    }
  }

  const details = {};

  for (const [field, validate] of Object.entries(detailFields)) {
    if (!partial || Object.hasOwn(body, field)) {
      details[field] = validate(body[field]);
    }
  }

  if (partial && Object.keys(details).length === 0) {
    throw invalidInput("Provide at least one field to update.");
  }

  return details;
}

function readQueryText(query, key, fallback = "") {
  const value = query[key] ?? fallback;

  if (typeof value !== "string" || value.includes("\0")) {
    throw invalidQuery(`Provide one valid value for ${key}.`);
  }

  return value.trim();
}

function readQueryInteger(query, key, fallback, max) {
  const value = readQueryText(query, key, String(fallback));
  const number = Number(value);

  if (!/^\d+$/.test(value) || !Number.isSafeInteger(number) || number < 1 || number > max) {
    throw invalidQuery(`${key} must be a whole number from 1 to ${max}.`);
  }

  return number;
}

function validateListQuery(query) {
  const search = readQueryText(query, "q");
  const status = readQueryText(query, "status");
  const reason = readQueryText(query, "reason");
  const sort = readQueryText(query, "sort", "newest");
  const page = readQueryInteger(query, "page", 1, maxInteger);
  const pageSize = readQueryInteger(query, "pageSize", 10, 50);

  if (status && !statuses.includes(status)) {
    throw invalidQuery("Choose a valid status.");
  }

  if (reason && !reasons.includes(reason)) {
    throw invalidQuery("Choose a valid return reason.");
  }

  if (sort !== "newest" && sort !== "oldest") {
    throw invalidQuery("Sort must be newest or oldest.");
  }

  return { search, status, reason, sort, page, pageSize };
}

function validateTransition(body) {
  const { status, resolution, refundAmount } = requireObject(body);

  if (!statuses.includes(status)) {
    throw invalidInput("Choose a valid target status.");
  }

  if (status !== "Approved") {
    if (resolution != null || refundAmount != null) {
      throw invalidInput("Send resolution and refund amount only when approving.");
    }

    return { status };
  }

  if (!resolutions.includes(resolution)) {
    throw invalidInput("Choose Refund, Replacement, or Store Credit to approve.");
  }

  if (resolution !== "Refund") {
    if (refundAmount != null) {
      throw invalidInput("A refund amount is allowed only with the Refund resolution.");
    }

    return { status, resolution, refundAmount: null };
  }

  const hasAmount = typeof refundAmount === "number" || typeof refundAmount === "string";
  const amountText = hasAmount ? String(refundAmount).trim() : "";

  if (!/^\d{1,8}(\.\d{1,2})?$/.test(amountText) || Number(amountText) <= 0) {
    throw invalidInput("Enter a positive refund amount with up to two decimal places.");
  }

  return { status, resolution, refundAmount: amountText };
}

function validateNote(body) {
  return readText(requireObject(body).body, "Note", 2000);
}

module.exports = {
  validateId,
  validateDetails,
  validateListQuery,
  validateTransition,
  validateNote,
};