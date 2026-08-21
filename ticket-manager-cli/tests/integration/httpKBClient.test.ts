import * as http from 'http';
import { startKbServer } from '../../src/server/kbServer';
import { HTTPKBClient } from '../../src/kb/HTTPKBClient';
import { DocumentNotFoundError, KBValidationError } from '../../src/kb/errors';
import { runCliJsonAsync } from '../helpers/runCli';
import { Document, SearchResult } from '../../src/kb/types';

/**
 * Integration tests: spin up the *real* mock KB HTTP server (the same one
 * `npm run kb-server` starts) on an ephemeral port, then exercise
 * HTTPKBClient against it over actual HTTP -- no mocked fetch/network layer.
 */
describe('HTTPKBClient (end-to-end against a real local server)', () => {
  let server: http.Server;
  let baseUrl: string;
  let client: HTTPKBClient;

  beforeAll(async () => {
    const started = await startKbServer(0);
    server = started.server;
    baseUrl = `http://localhost:${started.port}`;
    client = new HTTPKBClient(baseUrl);
  });

  afterAll(() => {
    server.close();
  });

  it('search returns results for a matching term', async () => {
    const results = await client.search({ query: 'template' });
    expect(results.some((r) => r.id === 'doc-001')).toBe(true);
  });

  it('list returns documents under a node path', async () => {
    const docs = await client.list({ nodePath: '/team/devops' });
    expect(docs).toHaveLength(1);
    expect(docs[0].id).toBe('doc-002');
  });

  it('retrieve returns the full document', async () => {
    const doc = await client.retrieve('doc-001');
    expect(doc.title).toBe('Customer Response Template');
    expect(doc.content.length).toBeGreaterThan(0);
  });

  it('retrieve throws DocumentNotFoundError (HTTP 404) for an unknown id', async () => {
    await expect(client.retrieve('doc-999')).rejects.toThrow(DocumentNotFoundError);
  });

  it('search throws KBValidationError (HTTP 400) for an empty query', async () => {
    await expect(client.search({ query: '' })).rejects.toThrow(KBValidationError);
  });

  it('add throws KBValidationError (HTTP 400) when the title is empty', async () => {
    await expect(
      client.add({ title: '', content: 'body', nodePath: '/team/devops', tags: [] })
    ).rejects.toThrow(KBValidationError);
  });

  it('add persists a new document that a later retrieve can find (server keeps state across requests)', async () => {
    const added = await client.add({
      title: 'On-call Runbook',
      content: 'Steps to follow when paged.',
      nodePath: '/team/devops',
      tags: ['runbook']
    });

    const retrieved = await client.retrieve(added.id);
    expect(retrieved).toEqual(added);
  });

  describe('through the CLI (KB_CLIENT=http)', () => {
    // Uses runCliJsonAsync (not the sync runCli used elsewhere): the KB
    // server here runs in this same Jest process, and a blocking spawnSync
    // would freeze the event loop the server needs to answer the request --
    // see the comment on runCli in tests/helpers/runCli.ts.
    it('runs `kb search` and `kb retrieve` end-to-end against the running server', async () => {
      const env = { KB_CLIENT: 'http', KB_API_URL: baseUrl };

      const results = await runCliJsonAsync<SearchResult[]>(['kb', 'search', 'DevOps'], env);
      expect(results.some((r) => r.id === 'doc-002')).toBe(true);

      const doc = await runCliJsonAsync<Document>(['kb', 'retrieve', 'doc-002'], env);
      expect(doc.title).toBe('DevOps Team Members');
    });
  });
});
