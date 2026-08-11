import { randomUUID } from 'crypto';
import {
  Ticket,
  TicketStatus,
  TicketPriority,
  isTicketStatus,
  isTicketPriority
} from '../models/Ticket';
import { ValidationError, TicketNotFoundError } from '../models/errors';
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

const DEFAULT_STATUS: TicketStatus = 'open';
const DEFAULT_PRIORITY: TicketPriority = 'medium';

export class TicketService {
  constructor(private readonly repository: TicketRepository) {}

  create(input: CreateTicketInput): Ticket {
    const title = (input.title ?? '').trim();
    if (title === '') {
      throw new ValidationError('Ticket "title" is required and cannot be empty.');
    }

    const status = validateStatus(input.status, DEFAULT_STATUS);
    const priority = validatePriority(input.priority, DEFAULT_PRIORITY);
    const tags = normalizeTags(input.tags);
    const now = new Date().toISOString();

    const ticket: Ticket = {
      id: randomUUID(),
      title,
      description: input.description?.trim() ?? '',
      status,
      priority,
      tags,
      createdAt: now,
      updatedAt: now
    };

    const tickets = this.repository.readAll();
    tickets.push(ticket);
    this.repository.writeAll(tickets);

    return ticket;
  }

  list(filters: ListTicketFilters = {}): Ticket[] {
    let tickets = this.repository.readAll();

    if (filters.status !== undefined) {
      const status = validateStatus(filters.status, undefined, 'filter');
      tickets = tickets.filter((t) => t.status === status);
    }

    if (filters.priority !== undefined) {
      const priority = validatePriority(filters.priority, undefined, 'filter');
      tickets = tickets.filter((t) => t.priority === priority);
    }

    if (filters.tags && filters.tags.length > 0) {
      const wanted = normalizeTags(filters.tags);
      tickets = tickets.filter((t) => wanted.every((tag) => t.tags.includes(tag)));
    }

    return tickets;
  }

  show(id: string): Ticket {
    const ticket = this.repository.readAll().find((t) => t.id === id);
    if (!ticket) {
      throw new TicketNotFoundError(id);
    }
    return ticket;
  }

  update(id: string, changes: UpdateTicketInput): Ticket {
    const tickets = this.repository.readAll();
    const index = tickets.findIndex((t) => t.id === id);
    if (index === -1) {
      throw new TicketNotFoundError(id);
    }

    const existing = tickets[index];
    const updated: Ticket = { ...existing };

    if (changes.title !== undefined) {
      const title = changes.title.trim();
      if (title === '') {
        throw new ValidationError('Ticket "title" cannot be empty.');
      }
      updated.title = title;
    }

    if (changes.description !== undefined) {
      updated.description = changes.description.trim();
    }

    if (changes.status !== undefined) {
      updated.status = validateStatus(changes.status);
    }

    if (changes.priority !== undefined) {
      updated.priority = validatePriority(changes.priority);
    }

    if (changes.tags !== undefined) {
      updated.tags = normalizeTags(changes.tags);
    }

    updated.updatedAt = new Date().toISOString();

    tickets[index] = updated;
    this.repository.writeAll(tickets);

    return updated;
  }
}

function validateStatus(
  value: string | undefined,
  fallback?: TicketStatus,
  context: 'field' | 'filter' = 'field'
): TicketStatus {
  if (value === undefined) {
    if (fallback !== undefined) return fallback;
    throw new ValidationError('Ticket "status" is required.');
  }
  if (!isTicketStatus(value)) {
    throw new ValidationError(
      `Invalid ${context === 'filter' ? 'status filter' : 'status'} "${value}". ` +
        `Valid values: open, in-progress, done.`
    );
  }
  return value;
}

function validatePriority(
  value: string | undefined,
  fallback?: TicketPriority,
  context: 'field' | 'filter' = 'field'
): TicketPriority {
  if (value === undefined) {
    if (fallback !== undefined) return fallback;
    throw new ValidationError('Ticket "priority" is required.');
  }
  if (!isTicketPriority(value)) {
    throw new ValidationError(
      `Invalid ${context === 'filter' ? 'priority filter' : 'priority'} "${value}". ` +
        `Valid values: low, medium, high.`
    );
  }
  return value;
}

function normalizeTags(tags: string[] | undefined): string[] {
  if (!tags) return [];
  return tags
    .map((t) => t.trim())
    .filter((t) => t.length > 0);
}
