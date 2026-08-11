import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { TicketRepository } from '../../src/storage/TicketRepository';
import { TicketService } from '../../src/services/TicketService';
import { ValidationError, TicketNotFoundError } from '../../src/models/errors';

function tempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'ticket-service-test-'));
}

describe('TicketService', () => {
  let dir: string;
  let service: TicketService;

  beforeEach(() => {
    dir = tempDir();
    const repo = new TicketRepository(path.join(dir, 'tickets.json'));
    service = new TicketService(repo);
  });

  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  describe('create', () => {
    it('creates a ticket with defaults for status/priority/tags', () => {
      const ticket = service.create({ title: 'Fix login bug' });

      expect(ticket.title).toBe('Fix login bug');
      expect(ticket.description).toBe('');
      expect(ticket.status).toBe('open');
      expect(ticket.priority).toBe('medium');
      expect(ticket.tags).toEqual([]);
      expect(typeof ticket.id).toBe('string');
      expect(ticket.id.length).toBeGreaterThan(0);
      expect(ticket.createdAt).toBe(ticket.updatedAt);
      expect(() => new Date(ticket.createdAt).toISOString()).not.toThrow();
    });

    it('accepts explicit status, priority, description and tags', () => {
      const ticket = service.create({
        title: 'Investigate outage',
        description: 'Prod is down',
        status: 'in-progress',
        priority: 'high',
        tags: ['incident', ' urgent ', '']
      });

      expect(ticket.description).toBe('Prod is down');
      expect(ticket.status).toBe('in-progress');
      expect(ticket.priority).toBe('high');
      // trims whitespace and drops empty tags
      expect(ticket.tags).toEqual(['incident', 'urgent']);
    });

    it('persists the created ticket so it can be listed afterwards', () => {
      const created = service.create({ title: 'Persisted ticket' });
      const all = service.list();
      expect(all).toHaveLength(1);
      expect(all[0]).toEqual(created);
    });

    it('rejects an empty title', () => {
      expect(() => service.create({ title: '' })).toThrow(ValidationError);
      expect(() => service.create({ title: '   ' })).toThrow(/title/i);
    });

    it('rejects an invalid status', () => {
      expect(() => service.create({ title: 'x', status: 'not-a-status' })).toThrow(ValidationError);
      expect(() => service.create({ title: 'x', status: 'not-a-status' })).toThrow(/status/i);
    });

    it('rejects an invalid priority', () => {
      expect(() => service.create({ title: 'x', priority: 'urgent!!' })).toThrow(ValidationError);
      expect(() => service.create({ title: 'x', priority: 'urgent!!' })).toThrow(/priority/i);
    });

    it('does not write anything to storage when validation fails', () => {
      expect(() => service.create({ title: '' })).toThrow();
      expect(service.list()).toEqual([]);
    });
  });

  describe('list', () => {
    beforeEach(() => {
      service.create({ title: 'Bug A', status: 'open', priority: 'high', tags: ['bug', 'backend'] });
      service.create({ title: 'Bug B', status: 'in-progress', priority: 'low', tags: ['bug', 'frontend'] });
      service.create({ title: 'Feature C', status: 'done', priority: 'medium', tags: ['feature'] });
    });

    it('returns every ticket when no filters are given', () => {
      expect(service.list()).toHaveLength(3);
    });

    it('filters by status', () => {
      const result = service.list({ status: 'in-progress' });
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Bug B');
    });

    it('filters by priority', () => {
      const result = service.list({ priority: 'high' });
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Bug A');
    });

    it('filters by tags (ticket must include all given tags)', () => {
      const result = service.list({ tags: ['bug'] });
      expect(result.map((t) => t.title).sort()).toEqual(['Bug A', 'Bug B']);

      const narrower = service.list({ tags: ['bug', 'backend'] });
      expect(narrower).toHaveLength(1);
      expect(narrower[0].title).toBe('Bug A');
    });

    it('combines filters', () => {
      const result = service.list({ status: 'open', priority: 'high' });
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Bug A');
    });

    it('returns an empty array when no ticket matches', () => {
      expect(service.list({ tags: ['nonexistent'] })).toEqual([]);
    });

    it('rejects an invalid status filter', () => {
      expect(() => service.list({ status: 'bogus' })).toThrow(ValidationError);
    });
  });

  describe('show', () => {
    it('returns the ticket matching the given id', () => {
      const created = service.create({ title: 'Findable' });
      expect(service.show(created.id)).toEqual(created);
    });

    it('throws TicketNotFoundError for an unknown id', () => {
      expect(() => service.show('does-not-exist')).toThrow(TicketNotFoundError);
      expect(() => service.show('does-not-exist')).toThrow(/does-not-exist/);
    });
  });

  describe('update', () => {
    it('updates the given fields and bumps updatedAt', async () => {
      const created = service.create({ title: 'Original title', status: 'open' });

      // ensure a measurable time difference between createdAt and updatedAt
      await new Promise((resolve) => setTimeout(resolve, 5));

      const updated = service.update(created.id, { status: 'done', priority: 'high' });

      expect(updated.status).toBe('done');
      expect(updated.priority).toBe('high');
      expect(updated.title).toBe('Original title'); // untouched fields are preserved
      expect(updated.createdAt).toBe(created.createdAt);
      expect(updated.updatedAt).not.toBe(created.updatedAt);
    });

    it('persists updates', () => {
      const created = service.create({ title: 'Persist me' });
      service.update(created.id, { status: 'done' });

      const reloaded = service.show(created.id);
      expect(reloaded.status).toBe('done');
    });

    it('replaces tags rather than merging them', () => {
      const created = service.create({ title: 'Tag replace', tags: ['a', 'b'] });
      const updated = service.update(created.id, { tags: ['c'] });
      expect(updated.tags).toEqual(['c']);
    });

    it('throws TicketNotFoundError for an unknown id', () => {
      expect(() => service.update('missing-id', { status: 'done' })).toThrow(TicketNotFoundError);
    });

    it('rejects an invalid status', () => {
      const created = service.create({ title: 'x' });
      expect(() => service.update(created.id, { status: 'bogus' })).toThrow(ValidationError);
    });

    it('rejects clearing the title to empty', () => {
      const created = service.create({ title: 'x' });
      expect(() => service.update(created.id, { title: '   ' })).toThrow(ValidationError);
    });
  });
});
