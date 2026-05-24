import { Command } from 'commander';
import * as ProjectService from '../services/ProjectService.js';
import { formatSuccess, formatError, formatProject, formatProjectList } from './formatter.js';

export function registerProjectCommands(program: Command): void {
  const project = program
    .command('project')
    .description('Manage tiny house projects');

  project
    .command('create')
    .description('Create a new project')
    .argument('<name>', 'Project name')
    .option('-d, --description <text>', 'Project description')
    .action(async (name: string, options: { description?: string }) => {
      const result = await ProjectService.create(name, options.description);

      if (result.success) {
        console.log(formatSuccess(`Project "${result.data.name}" created.`));
      } else {
        console.error(formatError(new Error(result.error)));
        process.exit(1);
      }
    });

  project
    .command('list')
    .description('List all projects')
    .action(async () => {
      const result = await ProjectService.list();

      if (result.success) {
        console.log(formatProjectList(result.data));
      } else {
        console.error(formatError(new Error(result.error)));
        process.exit(1);
      }
    });

  project
    .command('get')
    .description('Get project details')
    .argument('<name>', 'Project name')
    .action(async (name: string) => {
      const result = await ProjectService.get(name);

      if (result.success) {
        console.log(formatProject(result.data));
      } else {
        console.error(formatError(new Error(result.error)));
        process.exit(1);
      }
    });

  project
    .command('delete')
    .description('Delete a project')
    .argument('<name>', 'Project name')
    .action(async (name: string) => {
      const result = await ProjectService.deleteProject(name);

      if (result.success) {
        console.log(formatSuccess(`Project "${name}" deleted.`));
      } else {
        console.error(formatError(new Error(result.error)));
        process.exit(1);
      }
    });
}
