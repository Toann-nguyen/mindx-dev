/**
 * Domain model for a Ticket.
 *
 * Kept deliberately free of any storage/CLI concerns -- this is the
 * "model" layer described in Week 2's architecture (commands -> service -> storage).
 */

export const TICKET_STATUSES = ['open', 'in-progress', 'done'] as const;
export type TicketStatus = (typeof TICKET_STATUSES)[number];

export const TICKET_PRIORITIES = ['low', 'medium', 'high'] as const;
export type TicketPriority = (typeof TICKET_PRIORITIES)[number];

export interface Ticket {
  id: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  tags: string[];
  createdAt: string; // ISO-8601
  updatedAt: string; // ISO-8601
}

export function isTicketStatus(value: unknown): value is TicketStatus {
  return typeof value === 'string' && (TICKET_STATUSES as readonly string[]).includes(value);
}

export function isTicketPriority(value: unknown): value is TicketPriority {
  return typeof value === 'string' && (TICKET_PRIORITIES as readonly string[]).includes(value);
}
