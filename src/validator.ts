import { ValidationError } from './errors.js';
import { VALID_CATEGORIES, NAME_MAX, DESC_MAX, UNIT_MAX, NOTES_MAX } from './constants.js';
import type { CategoryName } from './types.js';

/**
 * Validates a project name.
 * Trims the input, checks it is non-empty, and checks length ≤ NAME_MAX (100).
 * Throws ValidationError if invalid.
 */
export function validateProjectName(name: string): void {
  const trimmed = name.trim();
  if (trimmed.length === 0) {
    throw new ValidationError('name', 'Project name cannot be empty or whitespace-only.');
  }
  if (trimmed.length > NAME_MAX) {
    throw new ValidationError(
      'name',
      `Project name must be ${NAME_MAX} characters or fewer (got: ${trimmed.length}).`
    );
  }
}

/**
 * Validates a project description.
 * Trims the input and checks length ≤ DESC_MAX (500).
 * Throws ValidationError if invalid.
 */
export function validateDescription(desc: string): void {
  const trimmed = desc.trim();
  if (trimmed.length > DESC_MAX) {
    throw new ValidationError(
      'description',
      `Description must be ${DESC_MAX} characters or fewer (got: ${trimmed.length}).`
    );
  }
}

/**
 * Validates a line item name.
 * Trims the input, checks it is non-empty, and checks length ≤ NAME_MAX (100).
 * Throws ValidationError if invalid.
 */
export function validateLineItemName(name: string): void {
  const trimmed = name.trim();
  if (trimmed.length === 0) {
    throw new ValidationError('name', 'Line item name cannot be empty or whitespace-only.');
  }
  if (trimmed.length > NAME_MAX) {
    throw new ValidationError(
      'name',
      `Line item name must be ${NAME_MAX} characters or fewer (got: ${trimmed.length}).`
    );
  }
}

/**
 * Validates a category string.
 * Checks membership in VALID_CATEGORIES.
 * Throws ValidationError listing all valid categories if invalid.
 * Returns the validated CategoryName on success.
 */
export function validateCategory(cat: string): CategoryName {
  if ((VALID_CATEGORIES as string[]).includes(cat)) {
    return cat as CategoryName;
  }
  throw new ValidationError(
    'category',
    `Invalid category "${cat}". Valid categories: ${VALID_CATEGORIES.join(', ')}`
  );
}

/**
 * Validates a quantity value.
 * Checks that the value is numeric and within the range 0.01–999,999.99.
 * Throws ValidationError if invalid.
 * Returns the validated number on success.
 */
export function validateQuantity(qty: unknown): number {
  const n = Number(qty);
  if (!Number.isFinite(n)) {
    throw new ValidationError('quantity', `quantity must be a number (got: ${String(qty)})`);
  }
  if (n < 0.01 || n > 999_999.99) {
    throw new ValidationError(
      'quantity',
      `quantity must be between 0.01 and 999,999.99 (got: ${n})`
    );
  }
  return n;
}

/**
 * Validates a unit cost value.
 * Checks that the value is numeric and within the range 0.00–999,999,999.99.
 * Throws ValidationError if invalid.
 * Returns the validated number on success.
 */
export function validateUnitCost(cost: unknown): number {
  const n = Number(cost);
  if (!Number.isFinite(n)) {
    throw new ValidationError('unitCost', `unit cost must be a number (got: ${String(cost)})`);
  }
  if (n < 0 || n > 999_999_999.99) {
    throw new ValidationError(
      'unitCost',
      `unit cost must be between 0.00 and 999,999,999.99 (got: ${n})`
    );
  }
  return n;
}

/**
 * Validates a unit string.
 * Trims the input, checks it is non-empty, and checks length ≤ UNIT_MAX (50).
 * Throws ValidationError if invalid.
 */
export function validateUnit(unit: string): void {
  const trimmed = unit.trim();
  if (trimmed.length === 0) {
    throw new ValidationError('unit', 'Unit cannot be empty or whitespace-only.');
  }
  if (trimmed.length > UNIT_MAX) {
    throw new ValidationError(
      'unit',
      `Unit must be ${UNIT_MAX} characters or fewer (got: ${trimmed.length}).`
    );
  }
}

/**
 * Validates notes.
 * Trims the input and checks length ≤ NOTES_MAX (500).
 * Throws ValidationError if invalid.
 */
export function validateNotes(notes: string): void {
  const trimmed = notes.trim();
  if (trimmed.length > NOTES_MAX) {
    throw new ValidationError(
      'notes',
      `Notes must be ${NOTES_MAX} characters or fewer (got: ${trimmed.length}).`
    );
  }
}
