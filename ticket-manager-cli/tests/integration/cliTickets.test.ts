import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { runCli, runCliJson } from '../helpers/runCli';
import { Ticket } from '../../src/models/Ticket';

/**
 * End-to-end tests: spawn the *built* CLI binary (dist/cli/index.js) as a
 * real subprocess against a fresh, isolated temp JSON file per test (via
 * TICKETS_FILE) so tests never share state.
 */
describe('tickets CLI (end-to-end)', () => {
  let dir: string;
  let ticketsFile: string;

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tickets-cli-test-'));
    ticketsFile = path.join(dir, 'tickets.json');
  });

  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('lists "No tickets found." with exit code 0 when the storage file does not exist yet', () => {
    const result = runCli(['tickets', 'list'], { TICKETS_FILE: ticketsFile });
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('No tickets found.');
  });

  it('creates a ticket and then lists it', () => {
    const created = runCliJson<Ticket>(
      ['tickets', 'create', '--title', 'Fix login bug', '--priority', 'high', '--tags', 'bug,auth'],
      { TICKETS_FILE: ticketsFile }
    );
    expect(created.title).toBe('Fix login bug');
    expect(created.priority).toBe('high');
    expect(created.status).toBe('open'); // default
    expect(created.tags).toEqual(['bug', 'auth']);

    const listed = runCliJson<Ticket[]>(['tickets', 'list'], { TICKETS_FILE: ticketsFile });
    expect(listed).toHaveLength(1);
    expect(listed[0].id).toBe(created.id);
  });

  it('shows ticket details by id', () => {
    const created = runCliJson<Ticket>(['tickets', 'create', '--title', 'Investigate outage'], {
      TICKETS_FILE: ticketsFile
    });

    const shown = runCliJson<Ticket>(['tickets', 'show', created.id], { TICKETS_FILE: ticketsFile });
    expect(shown).toEqual(created);
  });

  it('updates a ticket status and reflects the change on subsequent show', () => {
    const created = runCliJson<Ticket>(['tickets', 'create', '--title', 'Needs triage'], {
      TICKETS_FILE: ticketsFile
    });

    const updated = runCliJson<Ticket>(['tickets', 'update', created.id, '--status', 'done'], {
      TICKETS_FILE: ticketsFile
    });
    expect(updated.status).toBe('done');

    const shown = runCliJson<Ticket>(['tickets', 'show', created.id], { TICKETS_FILE: ticketsFile });
    expect(shown.status).toBe('done');
  });

  it('filters list results by status, priority and tags', () => {
    runCli(['tickets', 'create', '--title', 'A', '--status', 'open', '--priority', 'high', '--tags', 'bug'], {
      TICKETS_FILE: ticketsFile
    });
    runCli(
      ['tickets', 'create', '--title', 'B', '--status', 'in-progress', '--priority', 'low', '--tags', 'feature'],
      { TICKETS_FILE: ticketsFile }
    );

    const openOnly = runCliJson<Ticket[]>(['tickets', 'list', '--status', 'open'], {
      TICKETS_FILE: ticketsFile
    });
    expect(openOnly.map((t) => t.title)).toEqual(['A']);

    const byTag = runCliJson<Ticket[]>(['tickets', 'list', '--tags', 'feature'], {
      TICKETS_FILE: ticketsFile
    });
    expect(byTag.map((t) => t.title)).toEqual(['B']);
  });

  describe('error cases', () => {
    it('fails with a non-zero exit code when --title is missing', () => {
      const result = runCli(['tickets', 'create'], { TICKETS_FILE: ticketsFile });
      expect(result.status).not.toBe(0);
      expect(result.stderr).toMatch(/title/i);
    });

    it('fails with a non-zero exit code for an invalid --status', () => {
      const result = runCli(['tickets', 'create', '--title', 'x', '--status', 'bogus'], {
        TICKETS_FILE: ticketsFile
      });
      expect(result.status).not.toBe(0);
      expect(result.stderr).toMatch(/status/i);
    });

    it('fails with a non-zero exit code when showing an unknown ticket id', () => {
      const result = runCli(['tickets', 'show', 'does-not-exist'], { TICKETS_FILE: ticketsFile });
      expect(result.status).not.toBe(0);
      expect(result.stderr).toMatch(/not found/i);
    });

    it('fails with a non-zero exit code when updating an unknown ticket id', () => {
      const result = runCli(['tickets', 'update', 'does-not-exist', '--status', 'done'], {
        TICKETS_FILE: ticketsFile
      });
      expect(result.status).not.toBe(0);
      expect(result.stderr).toMatch(/not found/i);
    });

    it('fails clearly (not a raw stack trace) when the JSON storage file is corrupted', () => {
      fs.writeFileSync(ticketsFile, '{ not valid json ][', 'utf-8');

      const result = runCli(['tickets', 'list'], { TICKETS_FILE: ticketsFile });
      expect(result.status).not.toBe(0);
      expect(result.stderr).toMatch(/invalid JSON/i);
      expect(result.stderr).not.toMatch(/SyntaxError/); // wrapped, not a raw crash
    });
  });
});
