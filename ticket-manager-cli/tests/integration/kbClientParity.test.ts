import * as http from 'http';
import { startKbServer } from '../../src/server/kbServer';
import { HTTPKBClient } from '../../src/kb/HTTPKBClient';
import { MockKBClient } from '../../src/kb/MockKBClient';
import { KBClient } from '../../src/kb/types';
import { DocumentNotFoundError } from '../../src/kb/errors';

/**
 * Regression/parity tests: MockKBClient and HTTPKBClient share the exact
 * same seed data (see src/kb/seedDocuments.ts) and the exact same underlying
 * logic (src/kb/KBStore.ts), so for the same sequence of operations they
 * must produce equivalent results. This is what "swappable via KB_CLIENT"
 * (Week 3 acceptance criteria) actually means in practice.
 */
describe('MockKBClient vs HTTPKBClient parity', () => {
  let server: http.Server;
  let mock: KBClient;
  let http_: KBClient;

  beforeAll(async () => {
    const started = await startKbServer(0);
    server = started.server;
    http_ = new HTTPKBClient(`http://localhost:${started.port}`);
    mock = new MockKBClient();
  });

  afterAll(() => {
    server.close();
  });

  it('search returns the same results for both clients', async () => {
    const mockResults = await mock.search({ query: 'template' });
    const httpResults = await http_.search({ query: 'template' });
    expect(httpResults).toEqual(mockResults);
  });

  it('list returns the same documents for both clients', async () => {
    const mockDocs = await mock.list({ nodePath: '/team/devops' });
    const httpDocs = await http_.list({ nodePath: '/team/devops' });
    expect(httpDocs).toEqual(mockDocs);
  });

  it('retrieve returns the same document for both clients', async () => {
    const mockDoc = await mock.retrieve('doc-001');
    const httpDoc = await http_.retrieve('doc-001');
    expect(httpDoc).toEqual(mockDoc);
  });

  it('retrieve fails the same way (DocumentNotFoundError) for both clients on an unknown id', async () => {
    await expect(mock.retrieve('doc-999')).rejects.toThrow(DocumentNotFoundError);
    await expect(http_.retrieve('doc-999')).rejects.toThrow(DocumentNotFoundError);
  });

  it('add produces an equivalent new document (same generated id, given both start from identical seed data)', async () => {
    const input = {
      title: 'Escalation Policy',
      content: 'Who to page and when.',
      nodePath: '/team/devops',
      tags: ['policy']
    };

    const mockDoc = await mock.add(input);
    const httpDoc = await http_.add(input);

    expect(httpDoc).toEqual(mockDoc);
  });
});
