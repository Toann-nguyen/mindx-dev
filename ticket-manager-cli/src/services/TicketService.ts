import { Ticket } from '../models/Ticket';
import { TicketRepository } from '../storage/TicketRepository';

export interface CreateTicketInput {
  title: string;
  description?: string;
  status?: string;
  priority?: string;
  tags?: string[];
}

export interface UpdateTicketInput {
  title?: string;
  description?: string;
  status?: string;
  priority?: string;
  tags?: string[];
}

export interface ListTicketFilters {
  status?: string;
  priority?: string;
  tags?: string[];
}

export class TicketService {
  constructor(private readonly repository: TicketRepository) {}

  create(input: CreateTicketInput): Ticket {
    throw new Error('Not implemented: create');
  }

  list(filters: ListTicketFilters = {}): Ticket[] {
    throw new Error('Not implemented: list');
  }

  show(id: string): Ticket {
    throw new Error('Not implemented: show');
  }

  update(id: string, changes: UpdateTicketInput): Ticket {
    throw new Error('Not implemented: update');
  }
}
