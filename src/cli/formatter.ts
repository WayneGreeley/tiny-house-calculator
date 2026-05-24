import type { Project, LineItem, BillOfMaterials } from '../types.js';

/**
 * Formats a success message with a checkmark.
 */
export function formatSuccess(message: string): string {
  return `✓ ${message}`;
}

/**
 * Formats an error message with a cross mark.
 */
export function formatError(error: Error): string {
  return `✗ Error: ${error.message}`;
}

/**
 * Formats a project for display.
 */
export function formatProject(project: Project): string {
  const lines = [
    `Name: ${project.name}`,
    `Description: ${project.description || '(none)'}`,
    `Created: ${new Date(project.createdAt).toISOString().slice(0, 10)}`,
    `Items: ${project.lineItems.length}`,
  ];
  return lines.join('\n');
}

/**
 * Formats a list of projects for display.
 */
export function formatProjectList(projects: Project[]): string {
  if (projects.length === 0) {
    return 'No projects found.';
  }

  const lines = projects.map((p) => {
    const itemCount = p.lineItems.length;
    const itemText = itemCount === 1 ? 'item' : 'items';
    return `${p.name} (${itemCount} ${itemText})`;
  });

  return lines.join('\n');
}

/**
 * Formats a line item for display.
 */
export function formatLineItem(item: LineItem): string {
  const lines = [
    `ID: ${item.id}`,
    `Name: ${item.name}`,
    `Category: ${item.category}`,
    `Quantity: ${item.quantity} ${item.unit}`,
    `Unit Cost: $${item.unitCost.toFixed(2)}`,
    `Total Cost: $${item.totalCost.toFixed(2)}`,
  ];

  if (item.notes) {
    lines.push(`Notes: ${item.notes}`);
  }

  return lines.join('\n');
}

/**
 * Formats a list of line items for display.
 */
export function formatLineItemList(items: LineItem[]): string {
  if (items.length === 0) {
    return 'No items found.';
  }

  const lines = items.map((item) => {
    const cost = `$${item.totalCost.toFixed(2)}`;
    return `${item.id.slice(0, 8)}  ${item.name.padEnd(30)}  ${item.quantity} ${item.unit.padEnd(10)}  ${cost.padStart(12)}`;
  });

  return lines.join('\n');
}

/**
 * Formats a bill of materials for display.
 */
export function formatBom(bom: BillOfMaterials): string {
  const lines = [
    `Project: ${bom.projectName}`,
    `Description: ${bom.description || '(none)'}`,
    `Generated: ${bom.generatedDate}`,
    '',
  ];

  for (const section of bom.categories) {
    lines.push(section.category.toUpperCase());

    for (const item of section.lineItems) {
      const qty = `${item.quantity} ${item.unit}`;
      const unitCost = `$${item.unitCost.toFixed(2)}`;
      const totalCost = `$${item.totalCost.toFixed(2)}`;
      lines.push(`  ${item.name.padEnd(20)}  ${qty.padEnd(15)} @ ${unitCost.padEnd(10)}  ${totalCost.padStart(10)}`);
    }

    const subtotal = `$${section.subtotal.toFixed(2)}`;
    lines.push(`  ${'Subtotal:'.padEnd(20)}  ${''.padEnd(15)}   ${''.padEnd(10)}  ${subtotal.padStart(10)}`);
    lines.push('');
  }

  const grandTotal = `$${bom.grandTotal.toFixed(2)}`;
  lines.push(`GRAND TOTAL:${' '.repeat(38)}${grandTotal.padStart(10)}`);

  return lines.join('\n');
}
