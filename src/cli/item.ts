import { Command } from 'commander';
import * as LineItemService from '../services/LineItemService.js';
import type { CategoryName } from '../types.js';
import { formatSuccess, formatError, formatLineItem, formatLineItemList } from './formatter.js';

export function registerItemCommands(program: Command): void {
  const item = program
    .command('item')
    .description('Manage line items within a project');

  item
    .command('add')
    .description('Add a line item to a project')
    .argument('<project-name>', 'Project name')
    .requiredOption('-n, --name <text>', 'Item name')
    .requiredOption('-c, --category <category>', 'Item category')
    .requiredOption('-q, --quantity <number>', 'Quantity', parseFloat)
    .requiredOption('-u, --unit <text>', 'Unit of measurement')
    .requiredOption('--unit-cost <number>', 'Unit cost', parseFloat)
    .option('--notes <text>', 'Additional notes')
    .action(async (projectName: string, options: {
      name: string;
      category: string;
      quantity: number;
      unit: string;
      unitCost: number;
      notes?: string;
    }) => {
      const result = await LineItemService.add(projectName, {
        name: options.name,
        category: options.category as CategoryName,
        quantity: options.quantity,
        unit: options.unit,
        unitCost: options.unitCost,
        notes: options.notes,
      });

      if (result.success) {
        console.log(formatSuccess(`Line item added (id: ${result.data.id.slice(0, 8)}).`));
      } else {
        console.error(formatError(new Error(result.error)));
        process.exit(1);
      }
    });

  item
    .command('update')
    .description('Update a line item')
    .argument('<project-name>', 'Project name')
    .argument('<item-id>', 'Item ID')
    .option('-n, --name <text>', 'Item name')
    .option('-c, --category <category>', 'Item category')
    .option('-q, --quantity <number>', 'Quantity', parseFloat)
    .option('-u, --unit <text>', 'Unit of measurement')
    .option('--unit-cost <number>', 'Unit cost', parseFloat)
    .option('--notes <text>', 'Additional notes')
    .action(async (projectName: string, itemId: string, options: {
      name?: string;
      category?: string;
      quantity?: number;
      unit?: string;
      unitCost?: number;
      notes?: string;
    }) => {
      const result = await LineItemService.update(projectName, itemId, {
        name: options.name,
        category: options.category as CategoryName | undefined,
        quantity: options.quantity,
        unit: options.unit,
        unitCost: options.unitCost,
        notes: options.notes,
      });

      if (result.success) {
        console.log(formatSuccess(`Line item ${itemId.slice(0, 8)} updated.`));
      } else {
        console.error(formatError(new Error(result.error)));
        process.exit(1);
      }
    });

  item
    .command('remove')
    .description('Remove a line item from a project')
    .argument('<project-name>', 'Project name')
    .argument('<item-id>', 'Item ID')
    .action(async (projectName: string, itemId: string) => {
      const result = await LineItemService.remove(projectName, itemId);

      if (result.success) {
        console.log(formatSuccess(`Line item ${itemId.slice(0, 8)} removed.`));
      } else {
        console.error(formatError(new Error(result.error)));
        process.exit(1);
      }
    });

  item
    .command('list')
    .description('List line items in a project')
    .argument('<project-name>', 'Project name')
    .option('-c, --category <category>', 'Filter by category')
    .action(async (projectName: string, options: { category?: string }) => {
      const result = await LineItemService.list(
        projectName,
        options.category as CategoryName | undefined
      );

      if (result.success) {
        console.log(formatLineItemList(result.data));
      } else {
        console.error(formatError(new Error(result.error)));
        process.exit(1);
      }
    });
}
