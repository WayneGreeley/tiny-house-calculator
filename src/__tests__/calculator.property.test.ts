import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { Decimal } from 'decimal.js';
import { computeTotalCost } from '../calculator.js';

/**
 * Validates: Requirements 3.1
 *
 * Property 1: TotalCost is always quantity × unitCost rounded half-up to 2 decimal places
 */
describe('computeTotalCost', () => {
  it('Property 1: totalCost equals quantity × unitCost rounded half-up to 2dp', () => {
    fc.assert(
      fc.property(
        // Given: any valid quantity (0.01–999,999.99)
        fc.float({ min: Math.fround(0.01), max: Math.fround(999_999.99), noNaN: true }),
        // Given: any valid unit cost (0.00–999,999,999.99)
        fc.float({ min: Math.fround(0.0), max: Math.fround(999_999_999.99), noNaN: true }),
        (quantity, unitCost) => {
          // When: computeTotalCost is called
          const result = computeTotalCost(quantity, unitCost);

          // Then: result is a finite number
          expect(Number.isFinite(result)).toBe(true);

          // Then: result has at most 2 decimal places
          expect(Math.round(result * 100) / 100).toBe(result);

          // Then: result equals round_half_up(quantity × unitCost, 2)
          const expected = new Decimal(quantity)
            .mul(new Decimal(unitCost))
            .toDecimalPlaces(2, Decimal.ROUND_HALF_UP)
            .toNumber();
          expect(result).toBe(expected);
        }
      ),
      { numRuns: 100 }
    );
  });
});

import { computeGrandTotal } from '../calculator.js';

/**
 * Validates: Requirements 3.2, 3.4
 *
 * Property 2: GrandTotal equals the sum of all line item TotalCosts
 */
describe('computeGrandTotal', () => {
  it('Property 2: grandTotal equals Decimal-precise sum of all line item totalCosts rounded half-up to 2dp', () => {
    fc.assert(
      fc.property(
        // Given: any array of line items with valid totalCost values (finite floats >= 0)
        fc.array(
          fc.record({
            totalCost: fc.float({ min: 0, max: Math.fround(999_999_999.99), noNaN: true }),
          })
        ),
        (items) => {
          // When: computeGrandTotal is called with the array of line items
          const result = computeGrandTotal(items as any[]);

          // Then: result is a finite number
          expect(Number.isFinite(result)).toBe(true);

          // Then: result equals the Decimal-precise sum of all totalCost values rounded half-up to 2dp
          const expected = items
            .reduce((sum, item) => sum.plus(new Decimal(item.totalCost)), new Decimal(0))
            .toDecimalPlaces(2, Decimal.ROUND_HALF_UP)
            .toNumber();
          expect(result).toBe(expected);
        }
      ),
      { numRuns: 100 }
    );
  });
});

import { computeCategorySubtotals } from '../calculator.js';
import { VALID_CATEGORIES } from '../constants.js';

/**
 * Validates: Requirements 3.3
 *
 * Property 3: Category subtotals are consistent with line item TotalCosts
 */
describe('computeCategorySubtotals', () => {
  it('Property 3: each category subtotal equals the sum of totalCost for items in that category, and all subtotals sum to grandTotal', () => {
    fc.assert(
      fc.property(
        // Given: any array of line items with valid categories and totalCost values
        fc.array(
          fc.record({
            category: fc.constantFrom(...VALID_CATEGORIES),
            totalCost: fc.float({ min: 0, max: Math.fround(999_999_999.99), noNaN: true }),
          })
        ),
        (items) => {
          // When: computeCategorySubtotals is called
          const subtotals = computeCategorySubtotals(items as any[]);

          // Then: each category's subtotal equals the sum of totalCost for items in that category
          for (const [category, subtotal] of subtotals) {
            const expectedSubtotal = items
              .filter((item) => item.category === category)
              .reduce((sum, item) => sum.plus(new Decimal(item.totalCost)), new Decimal(0))
              .toDecimalPlaces(2, Decimal.ROUND_HALF_UP)
              .toNumber();
            expect(subtotal).toBe(expectedSubtotal);
          }

          // Then: the sum of all subtotals equals computeGrandTotal of the same items
          // Note: We're comparing the behavior, not requiring bit-exact equality,
          // since rounding at different stages (category subtotals vs grand total)
          // can produce slightly different results. They should be very close.
          const grandTotal = computeGrandTotal(items as any[]);
          const subtotalsSum = [...subtotals.values()]
            .reduce((sum, val) => sum.plus(new Decimal(val)), new Decimal(0))
            .toDecimalPlaces(2, Decimal.ROUND_HALF_UP)
            .toNumber();
          // Allow for small floating-point differences (within 0.02 due to rounding at different stages)
          expect(Math.abs(subtotalsSum - grandTotal)).toBeLessThanOrEqual(0.02);
        }
      ),
      { numRuns: 100 }
    );
  });
});
