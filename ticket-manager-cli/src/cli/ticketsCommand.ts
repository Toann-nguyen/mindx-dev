import * as path from 'path';
import { Command } from 'commander';
import { TicketRepository } from '../storage/TicketRepository';
import { TicketService } from '../services/TicketService';
import { printTicket, printTicketList, printJson } from './output';

export function registerTicketsCommands(program: Command): void {
  const getService = () => {
    const filePath =
      process.env.TICKETS_FILE ?? path.join(process.cwd(), 'data', 'tickets.json');
    return new TicketService(new TicketRepository(filePath));
  };

  const tickets = program.command('tickets').description('Manage tickets');

  tickets
    .command('create')
    .description('Create a new ticket')
    .option('-t, --title <title>', 'Ticket title (required)')
    .option('-d, --description <desc>', 'Ticket description')
    .option('-s, --status <status>', 'Status (open|in-progress|done)')
    .option('-p, --priority <priority>', 'Priority (low|medium|high)')
    .option('--tags <tags>', 'Comma-separated tags (e.g. "bug,urgent")')
    .option('--json', 'Output raw JSON')
    .action((opts) => {
      const service = getService();
      const tags = opts.tags ? opts.tags.split(',') : undefined;
      const ticket = service.create({
        title: opts.title,
        description: opts.description,
        status: opts.status,
        priority: opts.priority,
        tags
      });

      if (opts.json) {
        printJson(ticket);
      } else {
        console.log(`Created ticket "${ticket.id}" successfully.`);
        printTicket(ticket);
      }
    });

  tickets
    .command('list')
    .description('List tickets with optional filters')
    .option('-s, --status <status>', 'Filter by status (open|in-progress|done)')
    .option('-p, --priority <priority>', 'Filter by priority (low|medium|high)')
    .option('--tags <tags>', 'Filter by comma-separated tags (must include all)')
    .option('--json', 'Output raw JSON')
    .action((opts) => {
      const service = getService();
      const tags = opts.tags ? opts.tags.split(',') : undefined;
      const result = service.list({
        status: opts.status,
        priority: opts.priority,
        tags
      });

      if (opts.json) {
        printJson(result);
      } else {
        printTicketList(result);
      }
    });

  tickets
    .command('show')
    .description('Show details for a single ticket')
    .argument('<id>', 'Ticket ID')
    .option('--json', 'Output raw JSON')
    .action((id: string, opts) => {
      const service = getService();
      const ticket = service.show(id);
      if (opts.json) {
        printJson(ticket);
      } else {
        printTicket(ticket);
      }
    });

  tickets
    .command('update')
    .description('Update fields on an existing ticket')
    .argument('<id>', 'Ticket ID')
    .option('-t, --title <title>', 'New title')
    .option('-d, --description <desc>', 'New description')
    .option('-s, --status <status>', 'New status (open|in-progress|done)')
    .option('-p, --priority <priority>', 'New priority (low|medium|high)')
    .option('--tags <tags>', 'New comma-separated tags (replaces existing)')
    .option('--json', 'Output raw JSON')
    .action((id: string, opts) => {
      const service = getService();
      const tags = opts.tags !== undefined ? opts.tags.split(',') : undefined;
      const updated = service.update(id, {
        title: opts.title,
        description: opts.description,
        status: opts.status,
        priority: opts.priority,
        tags
      });

      if (opts.json) {
        printJson(updated);
      } else {
        console.log(`Updated ticket "${updated.id}" successfully.`);
        printTicket(updated);
      }
    });
}
