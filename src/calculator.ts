import { Decimal } from 'decimal.js';
import type { CategoryName, LineItem } from './types.js';

// Configure Decimal.js globally with ROUND_HALF_UP
Decimal.set({ rounding: Decimal.ROUND_HALF_UP });

/**
 * Computes the total cost for a line item.
 * Result is quantity × unitCost, rounded half-up to 2 decimal places.
 */
export function computeTotalCost(quantity: number, unitCost: number): number {
  return new Decimal(quantity)
    .mul(new Decimal(unitCost))
    .toDecimalPlaces(2)
    .toNumber();
}

/**
 * Computes the grand total across all line items.
 * Sums all totalCost values, rounded half-up to 2 decimal places.
 */
export function computeGrandTotal(lineItems: LineItem[]): number {
  return lineItems
    .reduce((sum, item) => sum.plus(new Decimal(item.totalCost)), new Decimal(0))
    .toDecimalPlaces(2)
    .toNumber();
}

/**
 * Computes the subtotal for each category present in the line items.
 * Each subtotal is the sum of totalCost for items in that category.
 */
export function computeCategorySubtotals(lineItems: LineItem[]): Map<CategoryName, number> {
  const subtotals = new Map<CategoryName, Decimal>();

  for (const item of lineItems) {
    const current = subtotals.get(item.category) ?? new Decimal(0);
    subtotals.set(item.category, current.plus(new Decimal(item.totalCost)));
  }

  const result = new Map<CategoryName, number>();
  for (const [category, total] of subtotals) {
    result.set(category, total.toDecimalPlaces(2).toNumber());
  }

  return result;
}
