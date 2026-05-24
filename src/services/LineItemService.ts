import { v4 as uuidv4 } from 'uuid';
import {
  validateLineItemName,
  validateCategory,
  validateQuantity,
  validateUnit,
  validateUnitCost,
  validateNotes,
} from '../validator.js';
import { computeTotalCost } from '../calculator.js';
import { NotFoundError } from '../errors.js';
import { readStore, writeStore } from '../repository/FileRepository.js';
import type { LineItem, Result, CategoryName } from '../types.js';

interface AddLineItemFields {
  name: string;
  category: string;
  quantity: number;
  unit: string;
  unitCost: number;
  notes?: string;
}

interface UpdateLineItemFields {
  name?: string;
  category?: string;
  quantity?: number;
  unit?: string;
  unitCost?: number;
  notes?: string;
}

/**
 * Adds a new line item to a project.
 * Validates all fields, assigns UUID v4 id, computes totalCost, and persists.
 *
 * @throws ValidationError if any field is invalid
 * @throws NotFoundError if project does not exist
 * @throws StorageError if persistence fails
 */
export async function add(
  projectName: string,
  fields: AddLineItemFields
): Promise<Result<LineItem>> {
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

    // Validate all fields
    validateLineItemName(fields.name);
    const validatedCategory = validateCategory(fields.category);
    const validatedQuantity = validateQuantity(fields.quantity);
    const validatedUnitCost = validateUnitCost(fields.unitCost);
    validateUnit(fields.unit);

    const trimmedName = fields.name.trim();
    const trimmedUnit = fields.unit.trim();
    const trimmedNotes = fields.notes?.trim() || '';

    if (trimmedNotes) {
      validateNotes(trimmedNotes);
    }

    // Compute total cost
    const totalCost = computeTotalCost(validatedQuantity, validatedUnitCost);

    // Create line item
    const lineItem: LineItem = {
      id: uuidv4(),
      name: trimmedName,
      category: validatedCategory,
      quantity: validatedQuantity,
      unit: trimmedUnit,
      unitCost: validatedUnitCost,
      totalCost,
      notes: trimmedNotes,
    };

    // Add to project
    project.lineItems.push(lineItem);

    // Persist
    await writeStore(store);

    return { success: true, data: lineItem };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: String(error) };
  }
}

/**
 * Updates an existing line item in a project.
 * Validates only provided fields, recomputes totalCost if quantity or unitCost changed.
 * Leaves item unchanged on validation failure.
 *
 * @throws ValidationError if any provided field is invalid
 * @throws NotFoundError if project or line item does not exist
 * @throws StorageError if persistence fails
 */
export async function update(
  projectName: string,
  itemId: string,
  fields: UpdateLineItemFields
): Promise<Result<LineItem>> {
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

    // Find line item
    const itemIndex = project.lineItems.findIndex((item) => item.id === itemId);

    if (itemIndex === -1) {
      throw new NotFoundError('LineItem', itemId);
    }

    const item = project.lineItems[itemIndex];

    // Create updated item starting with existing values
    const updatedItem = { ...item };

    // Validate and apply updates
    if (fields.name !== undefined) {
      validateLineItemName(fields.name);
      updatedItem.name = fields.name.trim();
    }

    if (fields.category !== undefined) {
      updatedItem.category = validateCategory(fields.category);
    }

    if (fields.quantity !== undefined) {
      updatedItem.quantity = validateQuantity(fields.quantity);
    }

    if (fields.unit !== undefined) {
      validateUnit(fields.unit);
      updatedItem.unit = fields.unit.trim();
    }

    if (fields.unitCost !== undefined) {
      updatedItem.unitCost = validateUnitCost(fields.unitCost);
    }

    if (fields.notes !== undefined) {
      const trimmedNotes = fields.notes.trim();
      if (trimmedNotes) {
        validateNotes(trimmedNotes);
      }
      updatedItem.notes = trimmedNotes;
    }

    // Recompute total cost if quantity or unitCost changed
    if (fields.quantity !== undefined || fields.unitCost !== undefined) {
      updatedItem.totalCost = computeTotalCost(
        updatedItem.quantity,
        updatedItem.unitCost
      );
    }

    // Replace item
    project.lineItems[itemIndex] = updatedItem;

    // Persist
    await writeStore(store);

    return { success: true, data: updatedItem };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: String(error) };
  }
}

/**
 * Removes a line item from a project by its ID.
 *
 * @throws NotFoundError if project or line item does not exist
 * @throws StorageError if persistence fails
 */
export async function remove(
  projectName: string,
  itemId: string
): Promise<Result<void>> {
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

    // Find line item
    const itemIndex = project.lineItems.findIndex((item) => item.id === itemId);

    if (itemIndex === -1) {
      throw new NotFoundError('LineItem', itemId);
    }

    // Remove item
    project.lineItems.splice(itemIndex, 1);

    // Persist
    await writeStore(store);

    return { success: true, data: undefined };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: String(error) };
  }
}

/**
 * Lists all line items in a project, optionally filtered by category.
 * Returns empty array when no matches.
 *
 * @throws NotFoundError if project does not exist
 * @throws StorageError if reading from storage fails
 */
export async function list(
  projectName: string,
  category?: CategoryName
): Promise<Result<LineItem[]>> {
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

    // Filter by category if provided
    let items = project.lineItems;
    if (category !== undefined) {
      items = items.filter((item) => item.category === category);
    }

    return { success: true, data: items };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: String(error) };
  }
}
