export class ValidationError extends Error {
  constructor(public readonly field: string, message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends Error {
  constructor(public readonly resource: string, public readonly identifier: string) {
    super(`${resource} not found: "${identifier}"`);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends Error {
  constructor(public readonly field: string, public readonly value: string) {
    super(`${field} already exists: "${value}"`);
    this.name = 'ConflictError';
  }
}

export class StorageError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'StorageError';
  }
}

export class ExportError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'ExportError';
  }
}
