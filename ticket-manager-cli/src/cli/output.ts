import { Ticket } from '../models/Ticket';

/**
 * Small output helpers shared by the CLI commands.
 *
 * Every command supports a `--json` flag (see index.ts) that prints raw JSON
 * instead of a human-readable summary. This keeps the CLI pleasant to use by
 * hand while also making it trivial to assert on in integration tests and to
 * script against.
 */

export function printJson(data: unknown): void {
  console.log(JSON.stringify(data, null, 2));
}

export function formatTicketLine(ticket: Ticket): string {
  const tags = ticket.tags.length > 0 ? ` [${ticket.tags.join(', ')}]` : '';
  return `${ticket.id}  ${padEnd(ticket.status, 11)} ${padEnd(ticket.priority, 6)} ${ticket.title}${tags}`;
}

export function printTicketList(tickets: Ticket[], json: boolean): void {
  if (json) {
    printJson(tickets);
    return;
  }
  if (tickets.length === 0) {
    console.log('No tickets found.');
    return;
  }
  for (const ticket of tickets) {
    console.log(formatTicketLine(ticket));
  }
}

export function printTicketDetail(ticket: Ticket, json: boolean): void {
  if (json) {
    printJson(ticket);
    return;
  }
  console.log(`ID:          ${ticket.id}`);
  console.log(`Title:       ${ticket.title}`);
  console.log(`Description: ${ticket.description || '(none)'}`);
  console.log(`Status:      ${ticket.status}`);
  console.log(`Priority:    ${ticket.priority}`);
  console.log(`Tags:        ${ticket.tags.length > 0 ? ticket.tags.join(', ') : '(none)'}`);
  console.log(`Created At:  ${ticket.createdAt}`);
  console.log(`Updated At:  ${ticket.updatedAt}`);
}

function padEnd(value: string, length: number): string {
  return value.length >= length ? value : value + ' '.repeat(length - value.length);
}
