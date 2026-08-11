import { Ticket } from '../models/Ticket';

export function printJson(data: unknown): void {
  console.log(JSON.stringify(data));
}

export function printTicket(_ticket: Ticket): void {}

export function printTicketList(_tickets: Ticket[]): void {}
