import { Command } from 'commander';
import * as BomService from '../services/BomService.js';
import { formatError, formatBom } from './formatter.js';

export function registerBomCommands(program: Command): void {
  const bom = program
    .command('bom')
    .description('View bill of materials for a project');

  bom
    .command('view')
    .description('View the bill of materials')
    .argument('<project-name>', 'Project name')
    .action(async (projectName: string) => {
      const result = await BomService.build(projectName);

      if (result.success) {
        console.log(formatBom(result.data));
      } else {
        console.error(formatError(new Error(result.error)));
        process.exit(1);
      }
    });
}
