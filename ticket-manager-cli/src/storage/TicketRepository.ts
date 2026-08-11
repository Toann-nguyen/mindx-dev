import { Ticket } from '../models/Ticket';

export class TicketRepository {
  constructor(private readonly filePath: string) {}

  readAll(): Ticket[] {
    throw new Error('Not implemented: readAll');
  }

  writeAll(tickets: Ticket[]): void {
    throw new Error('Not implemented: writeAll');
  }
}
