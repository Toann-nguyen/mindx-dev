import { Ticket } from '../models/Ticket';

export function printJson(data: unknown): void {
  console.log(JSON.stringify(data, null, 2));
}

export function printTicket(ticket: Ticket): void {
  console.log(`[${ticket.id}] ${ticket.title}`);
  console.log(`  Status:      ${ticket.status}`);
  console.log(`  Priority:    ${ticket.priority}`);
  console.log(`  Tags:        ${ticket.tags.length > 0 ? ticket.tags.join(', ') : '(none)'}`);
  if (ticket.description) {
    console.log(`  Description: ${ticket.description}`);
  }
  console.log(`  Created:     ${ticket.createdAt}`);
  console.log(`  Updated:     ${ticket.updatedAt}`);
}

export function printTicketList(tickets: Ticket[]): void {
  if (tickets.length === 0) {
    console.log('No tickets found.');
    return;
  }
  for (const t of tickets) {
    const tags = t.tags.length > 0 ? ` [${t.tags.join(', ')}]` : '';
    console.log(`[${t.id}] (${t.status}/${t.priority}) ${t.title}${tags}`);
  }
}
