class ApiError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

function invalidInput(message) {
  return new ApiError(400, "INVALID_INPUT", message);
}

function invalidQuery(message) {
  return new ApiError(400, "INVALID_QUERY", message);
}

function returnNotFound() {
  return new ApiError(404, "RETURN_NOT_FOUND", "Return request not found.");
}

function routeNotFound(request, response) {
  response.status(404).json({
    error: { code: "ROUTE_NOT_FOUND", message: "API route not found." },
  });
}

function handleError(error, request, response, next) {
  if (response.headersSent) {
    return next(error);
  }

  if (error.code === "23505" && error.constraint === "one_live_return_per_order_item") {
    return response.status(409).json({
      error: {
        code: "DUPLICATE_LIVE_RETURN",
        message: "A live return already exists for this order and item.",
      },
    });
  }

  if (error instanceof ApiError) {
    return response.status(error.status).json({
      error: { code: error.code, message: error.message },
    });
  }

  if (error.type === "entity.parse.failed" || error.type === "entity.too.large") {
    const message = error.type === "entity.too.large"
      ? "The request body is too large."
      : "The request body must contain valid JSON.";

    return response.status(error.status).json({
      error: { code: "INVALID_BODY", message },
    });
  }

  console.error("Returns API failed:", error.message);
  return response.status(500).json({
    error: { code: "RETURNS_API_FAILED", message: "Could not process the return request." },
  });
}

module.exports = { ApiError, invalidInput, invalidQuery, returnNotFound, routeNotFound, handleError };