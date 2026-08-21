import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { runCli, runCliJson } from '../helpers/runCli';
import { Document, SearchResult } from '../../src/kb/types';

/**
 * End-to-end tests for `tickets kb ...` against the built CLI, using the
 * mock KB client (KB_CLIENT=mock, which is also the default).
 */
describe('kb CLI (end-to-end, mock client)', () => {
  const env = { KB_CLIENT: 'mock' };

  it('search returns matching seeded documents', () => {
    const results = runCliJson<SearchResult[]>(['kb', 'search', 'template'], env);
    expect(results.some((r) => r.id === 'doc-001')).toBe(true);
  });

  it('search respects --top-k', () => {
    const results = runCliJson<SearchResult[]>(['kb', 'search', 'e', '--top-k', '1'], env);
    expect(results.length).toBeLessThanOrEqual(1);
  });

  it('list filters by --node', () => {
    const docs = runCliJson<Document[]>(['kb', 'list', '--node', '/team/devops'], env);
    expect(docs).toHaveLength(1);
    expect(docs[0].nodePath).toBe('/team/devops');
  });

  it('retrieve returns full document content', () => {
    const doc = runCliJson<Document>(['kb', 'retrieve', 'doc-001'], env);
    expect(doc.id).toBe('doc-001');
    expect(doc.content.length).toBeGreaterThan(0);
  });

  it('retrieve fails with a non-zero exit code and clear message for an unknown id', () => {
    const result = runCli(['kb', 'retrieve', 'doc-999'], env);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toMatch(/not found/i);
  });

  it('add creates a document from a local file, defaulting title to the file name', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kb-cli-test-'));
    const filePath = path.join(dir, 'new-template.md');
    fs.writeFileSync(filePath, '# New Template\n\nHello {{name}}', 'utf-8');

    // Note: the mock client is in-memory *per process*. Since every CLI
    // invocation is a fresh process, an `add` here would not be visible to a
    // *separate* `retrieve` invocation -- that round-trip is only meaningful
    // for a client whose state outlives a single process (e.g. HTTPKBClient
    // talking to a running server, see httpKBClient.test.ts). Here we assert
    // directly on the `add` command's own output.
    try {
      const doc = runCliJson<Document>(
        ['kb', 'add', '--file', filePath, '--path', '/templates/sms', '--tags', 'sms,template'],
        env
      );
      expect(doc.title).toBe('new-template');
      expect(doc.nodePath).toBe('/templates/sms');
      expect(doc.tags).toEqual(['sms', 'template']);
      expect(doc.content).toContain('Hello {{name}}');
      expect(doc.id).toMatch(/^doc-\d{3}$/);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('add fails with a non-zero exit code when required options are missing', () => {
    const result = runCli(['kb', 'add', '--path', '/templates/sms'], env);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toMatch(/file/i);
  });

  it('add fails with a clear message when the --file does not exist', () => {
    const result = runCli(
      ['kb', 'add', '--file', '/no/such/file.md', '--path', '/templates/sms'],
      env
    );
    expect(result.status).not.toBe(0);
    expect(result.stderr).toMatch(/not found|cannot|no such/i);
  });
});
