import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { TicketRepository } from '../../src/storage/TicketRepository';
import { StorageError } from '../../src/models/errors';
import { Ticket } from '../../src/models/Ticket';

function tempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'ticket-repo-test-'));
}

const sampleTicket: Ticket = {
  id: 'abc-123',
  title: 'Sample ticket',
  description: 'A description',
  status: 'open',
  priority: 'medium',
  tags: ['sample'],
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z'
};

describe('TicketRepository', () => {
  let dir: string;
  let filePath: string;

  beforeEach(() => {
    dir = tempDir();
    filePath = path.join(dir, 'tickets.json');
  });

  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('returns an empty array when the storage file does not exist yet', () => {
    const repo = new TicketRepository(filePath);
    expect(repo.readAll()).toEqual([]);
  });

  it('round-trips tickets written with writeAll', () => {
    const repo = new TicketRepository(filePath);
    repo.writeAll([sampleTicket]);

    const loaded = repo.readAll();
    expect(loaded).toHaveLength(1);
    expect(loaded[0]).toEqual(sampleTicket);
  });

  it('creates missing parent directories on write', () => {
    const nestedPath = path.join(dir, 'nested', 'deeper', 'tickets.json');
    const repo = new TicketRepository(nestedPath);

    repo.writeAll([sampleTicket]);

    expect(fs.existsSync(nestedPath)).toBe(true);
    expect(repo.readAll()).toEqual([sampleTicket]);
  });

  it('treats an empty file as an empty ticket list', () => {
    fs.writeFileSync(filePath, '', 'utf-8');
    const repo = new TicketRepository(filePath);
    expect(repo.readAll()).toEqual([]);
  });

  it('throws a StorageError with a clear message on corrupted (invalid) JSON', () => {
    fs.writeFileSync(filePath, '{ this is not valid JSON ][', 'utf-8');
    const repo = new TicketRepository(filePath);

    expect(() => repo.readAll()).toThrow(StorageError);
    try {
      repo.readAll();
      fail('expected readAll to throw');
    } catch (err) {
      expect(err).toBeInstanceOf(StorageError);
      expect((err as StorageError).message).toMatch(/invalid JSON/i);
      expect((err as StorageError).message).toContain(filePath);
    }
  });

  it('throws a StorageError when the JSON is valid but not an array', () => {
    fs.writeFileSync(filePath, JSON.stringify({ not: 'an array' }), 'utf-8');
    const repo = new TicketRepository(filePath);

    expect(() => repo.readAll()).toThrow(StorageError);
    expect(() => repo.readAll()).toThrow(/expected a JSON array/i);
  });
});
