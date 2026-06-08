class ApiResponse {
  static success(res, data = null, message = 'Success', statusCode = 200, meta = null) {
    const response = {
      success: true,
      statusCode,
      message,
      data,
      timestamp: new Date().toISOString(),
    };

    if (meta) response.meta = meta;
    return res.status(statusCode).json(response);
  }

  static created(res, data = null, message = 'Created successfully') {
    return this.success(res, data, message, 201);
  }

  static paginated(res, data, pagination, message = 'Success') {
    return this.success(res, data, message, 200, { pagination });
  }

  static error(res, message = 'An error occurred', statusCode = 500, errors = null) {
    const response = {
      success: false,
      statusCode,
      message,
      timestamp: new Date().toISOString(),
    };

    if (errors) response.errors = errors;
    return res.status(statusCode).json(response);
  }

  static badRequest(res, message = 'Bad Request', errors = null) {
    return this.error(res, message, 400, errors);
  }

  static unauthorized(res, message = 'Unauthorized') {
    return this.error(res, message, 401);
  }

  static forbidden(res, message = 'Forbidden') {
    return this.error(res, message, 403);
  }

  static notFound(res, message = 'Resource not found') {
    return this.error(res, message, 404);
  }

  static conflict(res, message = 'Conflict') {
    return this.error(res, message, 409);
  }

  static validationError(res, errors) {
    return this.error(res, 'Validation failed', 422, errors);
  }
}

module.exports = ApiResponse;
