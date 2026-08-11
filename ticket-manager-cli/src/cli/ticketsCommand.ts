import { Command } from 'commander';

export function registerTicketsCommands(program: Command): void {
  program
    .command('tickets')
    .description('Manage tickets')
    .action(() => {
      console.error('Not implemented');
      process.exit(1);
    });
}
