import { NotFoundError } from '../errors.js';
import { readStore } from '../repository/FileRepository.js';
import { computeGrandTotal, computeCategorySubtotals } from '../calculator.js';
import type { BillOfMaterials, Result, CategorySection, CategoryName } from '../types.js';

/**
 * Builds a bill of materials for a project.
 * Groups line items by category (omitting empty categories and items with quantity 0),
 * computes subtotals and grand total, sets generation date.
 *
 * @throws NotFoundError if project does not exist
 * @throws StorageError if reading from storage fails
 */
export async function build(projectName: string): Promise<Result<BillOfMaterials>> {
  try {
    // Load store
    const store = await readStore();
    const trimmedProjectName = projectName.trim();

    // Find project (case-insensitive)
    const project = store.projects.find(
      (p) => p.name.toLowerCase() === trimmedProjectName.toLowerCase()
    );

    if (!project) {
      throw new NotFoundError('Project', trimmedProjectName);
    }

    // Filter out items with quantity 0
    const activeItems = project.lineItems.filter((item) => item.quantity > 0);

    // Compute category subtotals
    const subtotalsMap = computeCategorySubtotals(activeItems);

    // Group items by category and build category sections
    const categories: CategorySection[] = [];
    const categoryNames = Array.from(subtotalsMap.keys()).sort();

    for (const categoryName of categoryNames) {
      const categoryItems = activeItems.filter((item) => item.category === categoryName);

      // Only include categories that have items (after filtering quantity 0)
      if (categoryItems.length > 0) {
        categories.push({
          category: categoryName,
          lineItems: categoryItems,
          subtotal: subtotalsMap.get(categoryName)!,
        });
      }
    }

    // Compute grand total
    const grandTotal = computeGrandTotal(activeItems);

    // Build bill of materials
    const bom: BillOfMaterials = {
      projectName: project.name,
      description: project.description,
      generatedDate: new Date().toISOString().slice(0, 10), // YYYY-MM-DD
      categories,
      grandTotal,
    };

    return { success: true, data: bom };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: String(error) };
  }
}
