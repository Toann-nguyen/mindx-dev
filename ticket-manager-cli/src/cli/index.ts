#!/usr/bin/env node
import { Command } from 'commander';
import { AppError } from '../models/errors';
import { registerTicketsCommands } from './ticketsCommand';

const program = new Command();
program
  .name('tickets')
  .description('Ticket Manager CLI -- manage tickets locally');

registerTicketsCommands(program);

async function main() {
  try {
    await program.parseAsync(process.argv);
  } catch (err) {
    if (err instanceof AppError) {
      console.error(`Error: ${err.message}`);
      process.exit(err.exitCode);
    }
    console.error(`Unexpected error: ${(err as Error).message}`);
    process.exit(1);
  }
}

main();
