export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;

  constructor(message: string, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this);
  }
}

export class DatabaseError extends AppError {
  constructor(message: string) {
    super(`Database error: ${message}`, 500, 'DATABASE_ERROR');
    this.name = 'DatabaseError';
  }
}

export class NotFoundError extends AppError {
  constructor(message: string) {
    super(message, 404, 'NOT_FOUND');
  }
}

export class BadRequestError extends AppError {
  constructor(message: string) {
    super(message, 400, 'BAD_REQUEST');
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'User does not have permission') {
    super(message, 403, 'FORBIDDEN');
  }
}
