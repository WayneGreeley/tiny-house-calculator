import { Command } from 'commander';
import { join } from 'path';
import * as BomService from '../services/BomService.js';
import { exportJson, exportCsv } from '../exporter.js';
import { formatSuccess, formatError } from './formatter.js';

export function registerExportCommands(program: Command): void {
  const exportCmd = program
    .command('export')
    .description('Export bill of materials to a file');

  exportCmd
    .command('json')
    .description('Export to JSON format')
    .argument('<project-name>', 'Project name')
    .option('-o, --output <filepath>', 'Output file path')
    .action(async (projectName: string, options: { output?: string }) => {
      const result = await BomService.build(projectName);

      if (!result.success) {
        console.error(formatError(new Error(result.error)));
        process.exit(1);
      }

      const outputPath = options.output || join(process.cwd(), `${projectName}-bom.json`);

      try {
        await exportJson(result.data, outputPath);
        console.log(formatSuccess(`Exported to ${outputPath}`));
      } catch (error) {
        console.error(formatError(error as Error));
        process.exit(1);
      }
    });

  exportCmd
    .command('csv')
    .description('Export to CSV format')
    .argument('<project-name>', 'Project name')
    .option('-o, --output <filepath>', 'Output file path')
    .action(async (projectName: string, options: { output?: string }) => {
      const result = await BomService.build(projectName);

      if (!result.success) {
        console.error(formatError(new Error(result.error)));
        process.exit(1);
      }

      const outputPath = options.output || join(process.cwd(), `${projectName}-bom.csv`);

      try {
        await exportCsv(result.data, outputPath);
        console.log(formatSuccess(`Exported to ${outputPath}`));
      } catch (error) {
        console.error(formatError(error as Error));
        process.exit(1);
      }
    });
}
