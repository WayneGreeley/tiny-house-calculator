#!/usr/bin/env node

import { Command } from 'commander';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { registerProjectCommands } from './cli/project.js';
import { registerItemCommands } from './cli/item.js';
import { registerBomCommands } from './cli/bom.js';
import { registerExportCommands } from './cli/export.js';
import { formatError } from './cli/formatter.js';

// Get package.json version
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJson = JSON.parse(
  readFileSync(join(__dirname, '../package.json'), 'utf-8')
);

// Create the main program
const program = new Command();

program
  .name('thc')
  .description('Tiny House Cost Calculator - Manage building project costs')
  .version(packageJson.version);

// Register all subcommands
registerProjectCommands(program);
registerItemCommands(program);
registerBomCommands(program);
registerExportCommands(program);

// Parse and execute
try {
  await program.parseAsync(process.argv);
} catch (error) {
  console.error(formatError(error as Error));
  process.exit(1);
}
