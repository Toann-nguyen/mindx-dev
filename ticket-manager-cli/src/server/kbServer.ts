import * as http from 'http';
import { AddressInfo } from 'net';
import { KBStore } from '../kb/KBStore';
import { createSeedDocuments } from '../kb/seedDocuments';
import { DocumentNotFoundError, KBValidationError } from '../kb/errors';
import { AppError } from '../models/errors';

/**
 * Minimal mock KB HTTP server implementing the API contract from
 * docs/plans/week-3/architecture.md:
 *   POST /search   { query, topK }              -> { results: SearchResult[] }
 *   POST /list     { nodePath, limit }           -> { documents: Document[] }
 *   POST /retrieve { docId }                     -> { document: Document }
 *   POST /add      { title, content, nodePath, tags } -> { document: Document }
 *
 * This exists because there is no real external KB server available for this
 * training project. It lets HTTPKBClient be genuinely integration-tested
 * end-to-end against a real running HTTP server (see
 * tests/integration/httpKBClient.test.ts) and can also be run standalone via
 * `npm run kb-server` so the CLI can be pointed at it with KB_CLIENT=http.
 *
 * It shares KBStore (and its seed data) with MockKBClient, so both "backends"
 * behave identically -- only the transport differs.
 */
export function createKbHttpServer(store: KBStore = new KBStore(createSeedDocuments())): http.Server {
  return http.createServer((req, res) => {
    void handleRequest(store, req, res);
  });
}

/** Starts the server on the given port (0 = ephemeral/OS-assigned) and resolves once listening. */
export function startKbServer(
  port = 0,
  store: KBStore = new KBStore(createSeedDocuments())
): Promise<{ server: http.Server; port: number }> {
  const server = createKbHttpServer(store);
  return new Promise((resolve) => {
    server.listen(port, () => {
      const address = server.address() as AddressInfo;
      resolve({ server, port: address.port });
    });
  });
}

async function handleRequest(store: KBStore, req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
  if (req.method !== 'POST') {
    sendJson(res, 404, { error: `No route for ${req.method} ${req.url}` });
    return;
  }

  let payload: unknown;
  try {
    payload = await readJsonBody(req);
  } catch (err) {
    sendJson(res, 400, { error: `Invalid JSON request body: ${(err as Error).message}` });
    return;
  }

  try {
    switch (req.url) {
      case '/search': {
        const body = payload as { query?: string; topK?: number };
        const results = store.search({ query: body.query ?? '', topK: body.topK });
        sendJson(res, 200, { results });
        return;
      }
      case '/list': {
        const body = payload as { nodePath?: string; limit?: number };
        const documents = store.list({ nodePath: body.nodePath, limit: body.limit });
        sendJson(res, 200, { documents });
        return;
      }
      case '/retrieve': {
        const body = payload as { docId?: string };
        const document = store.retrieve(body.docId ?? '');
        sendJson(res, 200, { document });
        return;
      }
      case '/add': {
        const body = payload as { title?: string; content?: string; nodePath?: string; tags?: string[] };
        const document = store.add({
          title: body.title ?? '',
          content: body.content ?? '',
          nodePath: body.nodePath ?? '',
          tags: body.tags ?? []
        });
        sendJson(res, 201, { document });
        return;
      }
      default:
        sendJson(res, 404, { error: `No route for POST ${req.url}` });
    }
  } catch (err) {
    if (err instanceof DocumentNotFoundError) {
      sendJson(res, 404, { error: err.message });
      return;
    }
    if (err instanceof KBValidationError) {
      sendJson(res, 400, { error: err.message });
      return;
    }
    if (err instanceof AppError) {
      sendJson(res, 400, { error: err.message });
      return;
    }
    sendJson(res, 500, { error: `Internal server error: ${(err as Error).message}` });
  }
}

function readJsonBody(req: http.IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
    });
    req.on('end', () => {
      if (raw.trim() === '') {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res: http.ServerResponse, statusCode: number, data: unknown): void {
  const body = JSON.stringify(data);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body),
    // Close the TCP connection after every response instead of keeping it
    // alive. Node's global fetch (undici) otherwise pools keep-alive
    // connections, which can leave sockets open indefinitely and make
    // `server.close()` hang waiting for them -- this matters a lot for
    // short-lived ephemeral servers spun up inside tests (see
    // tests/integration/httpKBClient.test.ts).
    Connection: 'close'
  });
  res.end(body);
}
