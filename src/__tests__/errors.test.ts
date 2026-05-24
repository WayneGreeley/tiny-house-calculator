import { describe, it, expect } from 'vitest';
import {
  ValidationError,
  NotFoundError,
  ConflictError,
  StorageError,
  ExportError,
} from '../errors.js';

// ─── ValidationError ────────────────────────────────────────────────────────

describe('ValidationError', () => {
  it('sets name, message, and field correctly', () => {
    // Given a ValidationError is instantiated with a field and message
    const error = new ValidationError('quantity', 'quantity must be between 0.01 and 999,999.99');

    // When the error is thrown and caught
    let caught: unknown;
    try {
      throw error;
    } catch (e) {
      caught = e;
    }

    // Then name, message, and field match the constructor arguments
    expect(caught).toBeInstanceOf(ValidationError);
    expect(caught).toBeInstanceOf(Error);
    const ve = caught as ValidationError;
    expect(ve.name).toBe('ValidationError');
    expect(ve.message).toBe('quantity must be between 0.01 and 999,999.99');
    expect(ve.field).toBe('quantity');
  });

  it('preserves the field value for any field name', () => {
    // Given a ValidationError with a different field name
    const error = new ValidationError('projectName', 'name cannot be empty');

    // When thrown and caught
    let caught: unknown;
    try {
      throw error;
    } catch (e) {
      caught = e;
    }

    // Then field matches the constructor argument
    const ve = caught as ValidationError;
    expect(ve.field).toBe('projectName');
    expect(ve.message).toBe('name cannot be empty');
  });
});

// ─── NotFoundError ───────────────────────────────────────────────────────────

describe('NotFoundError', () => {
  it('sets name, message, resource, and identifier correctly', () => {
    // Given a NotFoundError is instantiated with resource and identifier
    const error = new NotFoundError('Project', 'My Build');

    // When the error is thrown and caught
    let caught: unknown;
    try {
      throw error;
    } catch (e) {
      caught = e;
    }

    // Then name, message, resource, and identifier match the constructor arguments
    expect(caught).toBeInstanceOf(NotFoundError);
    expect(caught).toBeInstanceOf(Error);
    const nfe = caught as NotFoundError;
    expect(nfe.name).toBe('NotFoundError');
    expect(nfe.message).toBe('Project not found: "My Build"');
    expect(nfe.resource).toBe('Project');
    expect(nfe.identifier).toBe('My Build');
  });

  it('formats the message with the resource and identifier', () => {
    // Given a NotFoundError for a LineItem resource
    const error = new NotFoundError('LineItem', 'abc-123');

    // When thrown and caught
    let caught: unknown;
    try {
      throw error;
    } catch (e) {
      caught = e;
    }

    // Then the message includes both resource and identifier
    const nfe = caught as NotFoundError;
    expect(nfe.message).toBe('LineItem not found: "abc-123"');
    expect(nfe.resource).toBe('LineItem');
    expect(nfe.identifier).toBe('abc-123');
  });
});

// ─── ConflictError ───────────────────────────────────────────────────────────

describe('ConflictError', () => {
  it('sets name, message, field, and value correctly', () => {
    // Given a ConflictError is instantiated with field and value
    const error = new ConflictError('Project name', 'Mountain Cabin');

    // When the error is thrown and caught
    let caught: unknown;
    try {
      throw error;
    } catch (e) {
      caught = e;
    }

    // Then name, message, field, and value match the constructor arguments
    expect(caught).toBeInstanceOf(ConflictError);
    expect(caught).toBeInstanceOf(Error);
    const ce = caught as ConflictError;
    expect(ce.name).toBe('ConflictError');
    expect(ce.message).toBe('Project name already exists: "Mountain Cabin"');
    expect(ce.field).toBe('Project name');
    expect(ce.value).toBe('Mountain Cabin');
  });

  it('formats the message with the field and value', () => {
    // Given a ConflictError for a different field
    const error = new ConflictError('category', 'Framing');

    // When thrown and caught
    let caught: unknown;
    try {
      throw error;
    } catch (e) {
      caught = e;
    }

    // Then the message includes both field and value
    const ce = caught as ConflictError;
    expect(ce.message).toBe('category already exists: "Framing"');
    expect(ce.field).toBe('category');
    expect(ce.value).toBe('Framing');
  });
});

// ─── StorageError ────────────────────────────────────────────────────────────

describe('StorageError', () => {
  it('sets name and message correctly without a cause', () => {
    // Given a StorageError is instantiated with only a message
    const error = new StorageError('Failed to read data.json');

    // When the error is thrown and caught
    let caught: unknown;
    try {
      throw error;
    } catch (e) {
      caught = e;
    }

    // Then name and message match the constructor arguments and cause is undefined
    expect(caught).toBeInstanceOf(StorageError);
    expect(caught).toBeInstanceOf(Error);
    const se = caught as StorageError;
    expect(se.name).toBe('StorageError');
    expect(se.message).toBe('Failed to read data.json');
    expect(se.cause).toBeUndefined();
  });

  it('sets cause when provided', () => {
    // Given a StorageError is instantiated with a message and a cause
    const originalError = new Error('ENOENT: no such file or directory');
    const error = new StorageError('Failed to read data.json', originalError);

    // When the error is thrown and caught
    let caught: unknown;
    try {
      throw error;
    } catch (e) {
      caught = e;
    }

    // Then cause matches the provided cause argument
    const se = caught as StorageError;
    expect(se.cause).toBe(originalError);
    expect(se.message).toBe('Failed to read data.json');
  });
});

// ─── ExportError ─────────────────────────────────────────────────────────────

describe('ExportError', () => {
  it('sets name and message correctly without a cause', () => {
    // Given an ExportError is instantiated with only a message
    const error = new ExportError('Failed to write export file');

    // When the error is thrown and caught
    let caught: unknown;
    try {
      throw error;
    } catch (e) {
      caught = e;
    }

    // Then name and message match the constructor arguments and cause is undefined
    expect(caught).toBeInstanceOf(ExportError);
    expect(caught).toBeInstanceOf(Error);
    const ee = caught as ExportError;
    expect(ee.name).toBe('ExportError');
    expect(ee.message).toBe('Failed to write export file');
    expect(ee.cause).toBeUndefined();
  });

  it('sets cause when provided', () => {
    // Given an ExportError is instantiated with a message and a cause
    const originalError = new Error('EACCES: permission denied');
    const error = new ExportError('Failed to write export file', originalError);

    // When the error is thrown and caught
    let caught: unknown;
    try {
      throw error;
    } catch (e) {
      caught = e;
    }

    // Then cause matches the provided cause argument
    const ee = caught as ExportError;
    expect(ee.cause).toBe(originalError);
    expect(ee.message).toBe('Failed to write export file');
  });
});
