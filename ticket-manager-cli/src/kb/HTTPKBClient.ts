import * as http from 'http';
import * as https from 'https';
import { AddDocumentInput, Document, KBClient, KBListQuery, KBQuery, SearchResult } from './types';
import { DocumentNotFoundError, KBConnectionError, KBValidationError } from './errors';

/**
 * KBClient that talks to a real KB server over HTTP, following the API
 * contract documented in docs/plans/week-3/architecture.md:
 *   POST /search   { query, topK }     -> { results: SearchResult[] }
 *   POST /list     { nodePath, limit } -> { documents: Document[] }
 *   POST /retrieve { docId }           -> { document: Document }
 *   POST /add      { title, content, nodePath, tags } -> { document: Document }
 *
 * For local development/tests there is no real external KB service, so this
 * project ships a minimal server implementing the same contract
 * (src/server/kbServer.ts, run via `npm run kb-server`) that HTTPKBClient can
 * be pointed at.
 *
 * Implementation note: this deliberately uses Node's built-in `http`/`https`
 * modules instead of the global `fetch` (undici). Node's global fetch is
 * known to hang under Jest's default "node" test environment (a
 * package-exports resolution mismatch inside undici -- see
 * https://github.com/nodejs/undici/issues/1435), which would make the very
 * integration tests this client exists for unreliable. `http`/`https` avoid
 * that class of problem entirely and keep the KB server genuinely testable
 * end-to-end.
 */
export class HTTPKBClient implements KBClient {
  constructor(private readonly baseUrl: string) {}

  async search(query: KBQuery): Promise<SearchResult[]> {
    const body = await this.post<{ results: SearchResult[] }>('/search', {
      query: query.query,
      topK: query.topK
    });
    return body.results;
  }

  async list(query: KBListQuery = {}): Promise<Document[]> {
    const body = await this.post<{ documents: Document[] }>('/list', {
      nodePath: query.nodePath,
      limit: query.limit
    });
    return body.documents;
  }

  async retrieve(docId: string): Promise<Document> {
    const body = await this.post<{ document: Document }>('/retrieve', { docId }, docId);
    return body.document;
  }

  async add(input: AddDocumentInput): Promise<Document> {
    const body = await this.post<{ document: Document }>('/add', {
      title: input.title,
      content: input.content,
      nodePath: input.nodePath,
      tags: input.tags ?? []
    });
    return body.document;
  }

  private post<T>(path: string, payload: unknown, docIdForNotFound?: string): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch (err) {
      throw new KBConnectionError(`Invalid KB server URL "${url}": ${(err as Error).message}`);
    }

    const transport = parsed.protocol === 'https:' ? https : http;
    const requestBody = JSON.stringify(payload);

    return new Promise<T>((resolve, reject) => {
      const req = transport.request(
        parsed,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(requestBody),
            Connection: 'close'
          }
        },
        (res) => {
          const chunks: Buffer[] = [];
          res.on('data', (chunk) => chunks.push(chunk));
          res.on('end', () => {
            const raw = Buffer.concat(chunks).toString('utf-8');
            const status = res.statusCode ?? 0;

            let json: unknown;
            try {
              json = raw.trim() === '' ? {} : JSON.parse(raw);
            } catch {
              reject(
                new KBConnectionError(`KB server at ${url} returned a response that was not valid JSON.`)
              );
              return;
            }

            if (status < 200 || status >= 300) {
              const message =
                json && typeof json === 'object' && 'error' in json
                  ? String((json as { error: unknown }).error)
                  : `KB server returned HTTP ${status}`;

              if (status === 404 && docIdForNotFound !== undefined) {
                reject(new DocumentNotFoundError(docIdForNotFound));
              } else if (status >= 400 && status < 500) {
                reject(new KBValidationError(message));
              } else {
                reject(new KBConnectionError(message));
              }
              return;
            }

            resolve(json as T);
          });
        }
      );

      req.on('error', (err) => {
        reject(
          new KBConnectionError(
            `Could not reach KB server at ${url}. Is it running? (npm run kb-server) ` +
              `Underlying error: ${err.message}`
          )
        );
      });

      req.write(requestBody);
      req.end();
    });
  }
}
