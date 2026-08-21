import { Command } from 'commander';
import * as path from 'path';
import { TicketRepository } from '../storage/TicketRepository';
import { TicketService } from '../services/TicketService';
import { printTicketList, printTicketDetail } from './output';

/** Resolve the JSON storage file: --tickets-file flag > TICKETS_FILE env var > ./tickets.json */
function resolveTicketsFile(opts: Record<string, unknown>): string {
  const fromFlag = typeof opts.ticketsFile === 'string' ? opts.ticketsFile : undefined;
  return fromFlag ?? process.env.TICKETS_FILE ?? path.join(process.cwd(), 'tickets.json');
}

function buildService(opts: Record<string, unknown>): TicketService {
  const repo = new TicketRepository(resolveTicketsFile(opts));
  return new TicketService(repo);
}

function splitTags(value: string | undefined): string[] | undefined {
  if (value === undefined) return undefined;
  return value
    .split(',')
    .map((t) => t.trim())
    .filter((t) => t.length > 0);
}

export function registerTicketsCommand(program: Command): void {
  const tickets = program.command('tickets').description('Manage tickets stored in a local JSON file');

  tickets
    .command('create')
    .description('Create a new ticket')
    .requiredOption('--title <title>', 'Ticket title (required)')
    .option('--description <description>', 'Ticket description', '')
    .option('--status <status>', 'open | in-progress | done (default: open)')
    .option('--priority <priority>', 'low | medium | high (default: medium)')
    .option('--tags <tags>', 'Comma-separated tags, e.g. bug,backend')
    .action(function (this: Command, opts) {
      const globalOpts = this.optsWithGlobals();
      const service = buildService(globalOpts);
      const ticket = service.create({
        title: opts.title,
        description: opts.description,
        status: opts.status,
        priority: opts.priority,
        tags: splitTags(opts.tags)
      });
      printTicketDetail(ticket, Boolean(globalOpts.json));
    });

  tickets
    .command('list')
    .description('List tickets, optionally filtered by status, priority and/or tags')
    .option('--status <status>', 'Filter by status')
    .option('--priority <priority>', 'Filter by priority')
    .option('--tags <tags>', 'Filter by comma-separated tags (ticket must have all of them)')
    .action(function (this: Command, opts) {
      const globalOpts = this.optsWithGlobals();
      const service = buildService(globalOpts);
      const result = service.list({
        status: opts.status,
        priority: opts.priority,
        tags: splitTags(opts.tags)
      });
      printTicketList(result, Boolean(globalOpts.json));
    });

  tickets
    .command('show')
    .description('Show a single ticket by id')
    .argument('<id>', 'Ticket id')
    .action(function (this: Command, id: string) {
      const globalOpts = this.optsWithGlobals();
      const service = buildService(globalOpts);
      const ticket = service.show(id);
      printTicketDetail(ticket, Boolean(globalOpts.json));
    });

  tickets
    .command('update')
    .description('Update fields of an existing ticket')
    .argument('<id>', 'Ticket id')
    .option('--title <title>', 'New title')
    .option('--description <description>', 'New description')
    .option('--status <status>', 'New status: open | in-progress | done')
    .option('--priority <priority>', 'New priority: low | medium | high')
    .option('--tags <tags>', 'New comma-separated tags (replaces existing tags)')
    .action(function (this: Command, id: string, opts) {
      const globalOpts = this.optsWithGlobals();
      const service = buildService(globalOpts);
      const ticket = service.update(id, {
        title: opts.title,
        description: opts.description,
        status: opts.status,
        priority: opts.priority,
        tags: splitTags(opts.tags)
      });
      printTicketDetail(ticket, Boolean(globalOpts.json));
    });
}
