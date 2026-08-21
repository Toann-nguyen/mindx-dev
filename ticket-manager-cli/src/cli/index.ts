#!/usr/bin/env node
import { Command } from 'commander';
import { registerTicketsCommand } from './ticketsCommand';
import { registerKbCommand } from './kbCommand';
import { AppError } from '../models/errors';

/**
 * CLI entry point.
 *
 * Reference implementation for Week 2 (tickets) + Week 3 (kb) of the MindX
 * onboarding curriculum. See ticket-manager-cli/README.md before using this
 * as a template -- try building your own version with TDD first.
 */
const program = new Command();

program
  .name('tickets')
  .description(
    'Ticket Manager CLI (Week 2) with Knowledge Base integration (Week 3) -- reference implementation'
  )
  .version('1.0.0')
  .option('--json', 'Print machine-readable JSON output instead of a human-readable summary')
  .option(
    '--tickets-file <path>',
    'Path to the tickets JSON storage file (overrides TICKETS_FILE env var)'
  );

registerTicketsCommand(program);
registerKbCommand(program);

async function main(): Promise<void> {
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

  // `kb` commands may have used the global fetch (undici) to talk to an HTTP
  // KB server. Its keep-alive sockets can keep the event loop alive after
  // we're otherwise done, so exit explicitly instead of waiting for Node to
  // notice there's nothing left to do.
  process.exit(0);
}

void main();
