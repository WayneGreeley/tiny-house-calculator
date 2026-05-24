import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  validateProjectName,
  validateLineItemName,
  validateCategory,
  validateQuantity,
  validateUnitCost,
} from '../validator.js';
import { ValidationError } from '../errors.js';
import { VALID_CATEGORIES } from '../constants.js';

/**
 * Validates: Requirements 1.3, 6.2
 *
 * Property 5: Whitespace-only project names are always rejected
 */
describe('validateProjectName', () => {
  it('Property 5: whitespace-only project names are always rejected', () => {
    fc.assert(
      fc.property(
        // Given: any string composed entirely of whitespace characters
        fc.stringMatching(/^\s+$/),
        (whitespaceString) => {
          // When: validateProjectName is called
          // Then: a ValidationError is thrown
          expect(() => validateProjectName(whitespaceString)).toThrow(ValidationError);
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Validates: Requirements 6.1
 *
 * Property 6: Whitespace-only line item names are always rejected
 */
describe('validateLineItemName', () => {
  it('Property 6: whitespace-only line item names are always rejected', () => {
    fc.assert(
      fc.property(
        // Given: any string composed entirely of whitespace characters
        fc.stringMatching(/^\s+$/),
        (whitespaceString) => {
          // When: validateLineItemName is called
          // Then: a ValidationError is thrown
          expect(() => validateLineItemName(whitespaceString)).toThrow(ValidationError);
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Validates: Requirements 6.8
 *
 * Property 7: Input trimming is applied before validation
 */
describe('validateProjectName and validateLineItemName', () => {
  it('Property 7: input trimming is applied before validation (project names)', () => {
    fc.assert(
      fc.property(
        // Given: any valid name string (1-100 chars)
        fc.string({ minLength: 1, maxLength: 100 }).filter((s) => s.trim().length > 0),
        // Given: arbitrary leading whitespace
        fc.string({ maxLength: 5 }).map((s) => s.replace(/\S/g, ' ')),
        // Given: arbitrary trailing whitespace
        fc.string({ maxLength: 5 }).map((s) => s.replace(/\S/g, ' ')),
        (validName, leading, trailing) => {
          // When: validateProjectName is called with padded-but-valid name
          const paddedName = leading + validName + trailing;

          // Then: no error is thrown (trimmed value is used for validation)
          expect(() => validateProjectName(paddedName)).not.toThrow();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 7: input trimming is applied before validation (line item names)', () => {
    fc.assert(
      fc.property(
        // Given: any valid name string (1-100 chars)
        fc.string({ minLength: 1, maxLength: 100 }).filter((s) => s.trim().length > 0),
        // Given: arbitrary leading whitespace
        fc.string({ maxLength: 5 }).map((s) => s.replace(/\S/g, ' ')),
        // Given: arbitrary trailing whitespace
        fc.string({ maxLength: 5 }).map((s) => s.replace(/\S/g, ' ')),
        (validName, leading, trailing) => {
          // When: validateLineItemName is called with padded-but-valid name
          const paddedName = leading + validName + trailing;

          // Then: no error is thrown (trimmed value is used for validation)
          expect(() => validateLineItemName(paddedName)).not.toThrow();
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Validates: Requirements 6.7
 *
 * Property 8: Invalid category values are always rejected
 */
describe('validateCategory', () => {
  it('Property 8: invalid category values are always rejected', () => {
    fc.assert(
      fc.property(
        // Given: any string not in VALID_CATEGORIES
        fc.string().filter((s) => !VALID_CATEGORIES.includes(s as any)),
        (invalidCategory) => {
          // When: validateCategory is called
          // Then: a ValidationError is thrown whose message lists all valid categories
          try {
            validateCategory(invalidCategory);
            // If we get here, the validation didn't throw as expected
            expect.fail('Expected ValidationError to be thrown');
          } catch (error) {
            expect(error).toBeInstanceOf(ValidationError);
            const message = (error as ValidationError).message;
            // The error message should list all valid categories
            VALID_CATEGORIES.forEach((cat) => {
              expect(message).toContain(cat);
            });
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Validates: Requirements 2.3, 6.4
 *
 * Property 9: Quantity out of range is always rejected
 */
describe('validateQuantity', () => {
  it('Property 9: quantity out of range is always rejected (below minimum)', () => {
    fc.assert(
      fc.property(
        // Given: any numeric value below 0.01
        fc.float({ max: Math.fround(0.009), noNaN: true }),
        (belowMinQuantity) => {
          // When: validateQuantity is called
          // Then: a ValidationError is thrown identifying the quantity field and allowed range
          try {
            validateQuantity(belowMinQuantity);
            expect.fail('Expected ValidationError to be thrown');
          } catch (error) {
            expect(error).toBeInstanceOf(ValidationError);
            expect((error as ValidationError).field).toBe('quantity');
            const message = (error as ValidationError).message;
            // Message should mention the allowed range or "must be a number"
            expect(message.toLowerCase()).toMatch(/0\.01|range|must be a number/);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 9: quantity out of range is always rejected (above maximum)', () => {
    fc.assert(
      fc.property(
        // Given: any numeric value above 999,999.99
        fc.float({ min: 1_000_000, max: 10_000_000, noNaN: true }),
        (aboveMaxQuantity) => {
          // When: validateQuantity is called
          // Then: a ValidationError is thrown identifying the quantity field and allowed range
          try {
            validateQuantity(aboveMaxQuantity);
            expect.fail('Expected ValidationError to be thrown');
          } catch (error) {
            expect(error).toBeInstanceOf(ValidationError);
            expect((error as ValidationError).field).toBe('quantity');
            const message = (error as ValidationError).message;
            // Message should mention the allowed range
            expect(message.toLowerCase()).toMatch(/999,?999\.99|range/);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Validates: Requirements 2.4, 6.6
 *
 * Property 10: Unit cost out of range is always rejected
 */
describe('validateUnitCost', () => {
  it('Property 10: unit cost out of range is always rejected (below minimum)', () => {
    fc.assert(
      fc.property(
        // Given: any numeric value below 0.00 (negative)
        fc.float({ max: Math.fround(-0.01), noNaN: true }),
        (negativeUnitCost) => {
          // When: validateUnitCost is called
          // Then: a ValidationError is thrown identifying the unit cost field
          try {
            validateUnitCost(negativeUnitCost);
            expect.fail('Expected ValidationError to be thrown');
          } catch (error) {
            expect(error).toBeInstanceOf(ValidationError);
            expect((error as ValidationError).field).toBe('unitCost');
            const message = (error as ValidationError).message;
            // Message should mention either the range or that it must be a number (for infinity)
            expect(message.toLowerCase()).toMatch(/0\.00|range|must be a number/);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 10: unit cost out of range is always rejected (above maximum)', () => {
    fc.assert(
      fc.property(
        // Given: any numeric value above 999,999,999.99
        fc.float({ min: 1_000_000_000, max: 10_000_000_000, noNaN: true }),
        (aboveMaxUnitCost) => {
          // When: validateUnitCost is called
          // Then: a ValidationError is thrown identifying the unit cost field and allowed range
          try {
            validateUnitCost(aboveMaxUnitCost);
            expect.fail('Expected ValidationError to be thrown');
          } catch (error) {
            expect(error).toBeInstanceOf(ValidationError);
            expect((error as ValidationError).field).toBe('unitCost');
            const message = (error as ValidationError).message;
            // Message should mention the allowed range
            expect(message.toLowerCase()).toMatch(/999,?999,?999\.99|range/);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
