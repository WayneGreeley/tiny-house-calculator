import { promises as fs } from 'fs';
import { stringify } from 'csv-stringify/sync';
import { ExportError } from './errors.js';
import type { BillOfMaterials } from './types.js';

/**
 * Writes content to a file atomically.
 * Writes to a temporary file first, then renames to prevent partial writes.
 * Cleans up the temporary file if an error occurs.
 *
 * @throws ExportError if write or rename fails
 */
export async function writeAtomic(
  filePath: string,
  content: string
): Promise<void> {
  const tmpPath = `${filePath}.tmp`;

  try {
    // Write to temporary file
    await fs.writeFile(tmpPath, content, 'utf-8');

    // Atomic rename (POSIX guarantees atomicity)
    await fs.rename(tmpPath, filePath);
  } catch (error) {
    // Clean up temp file if it exists
    try {
      await fs.unlink(tmpPath);
    } catch {
      // Ignore cleanup errors
    }

    throw new ExportError(
      `Failed to write file to ${filePath}`,
      error
    );
  }
}

/**
 * Exports a bill of materials to JSON format.
 * Serializes with 2-space indentation for readability.
 *
 * @throws ExportError if write fails
 */
export async function exportJson(
  bom: BillOfMaterials,
  outputPath: string
): Promise<void> {
  try {
    const json = JSON.stringify(bom, null, 2);
    await writeAtomic(outputPath, json);
  } catch (error) {
    if (error instanceof ExportError) {
      throw error;
    }
    throw new ExportError(
      `Failed to export JSON to ${outputPath}`,
      error
    );
  }
}

/**
 * Exports a bill of materials to CSV format.
 * Creates one row per line item with category, name, quantity, unit, unit cost, total cost, and notes.
 *
 * @throws ExportError if write fails
 */
export async function exportCsv(
  bom: BillOfMaterials,
  outputPath: string
): Promise<void> {
  try {
    // Flatten all line items from all categories
    const rows = bom.categories.flatMap((section) =>
      section.lineItems.map((item) => [
        item.category,
        item.name,
        item.quantity,
        item.unit,
        item.unitCost,
        item.totalCost,
        item.notes,
      ])
    );

    // Generate CSV with header
    const csv = stringify(rows, {
      header: true,
      columns: [
        'category',
        'name',
        'quantity',
        'unit',
        'unit cost',
        'total cost',
        'notes',
      ],
    });

    await writeAtomic(outputPath, csv);
  } catch (error) {
    if (error instanceof ExportError) {
      throw error;
    }
    throw new ExportError(
      `Failed to export CSV to ${outputPath}`,
      error
    );
  }
}
