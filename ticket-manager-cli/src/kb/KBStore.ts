import { AddDocumentInput, Document, KBListQuery, KBQuery, SearchMatchType, SearchResult } from './types';
import { DocumentNotFoundError, KBValidationError } from './errors';

/**
 * In-memory document store implementing the actual search/list/retrieve/add
 * behavior. Both MockKBClient (in-process) and the mock KB HTTP server
 * (server/kbServer.ts) delegate to this class, so they behave identically --
 * the only difference between "mock" and "http" is the transport.
 */
export class KBStore {
  private documents: Document[];

  constructor(seedDocuments: Document[] = []) {
    this.documents = [...seedDocuments];
  }

  search(query: KBQuery): SearchResult[] {
    const term = (query.query ?? '').trim().toLowerCase();
    if (term === '') {
      throw new KBValidationError('Search query must not be empty.');
    }
    const topK = query.topK ?? 5;

    const results: SearchResult[] = [];
    for (const doc of this.documents) {
      const matchType = matchDocument(doc, term);
      if (matchType) {
        results.push({ id: doc.id, title: doc.title, nodePath: doc.nodePath, matchType });
      }
    }

    return results.slice(0, topK);
  }

  list(query: KBListQuery = {}): Document[] {
    const limit = query.limit ?? 10;
    let docs = this.documents;

    if (query.nodePath) {
      const prefix = query.nodePath;
      docs = docs.filter((d) => d.nodePath === prefix || d.nodePath.startsWith(`${prefix}/`));
    }

    return docs.slice(0, limit);
  }

  retrieve(docId: string): Document {
    const doc = this.documents.find((d) => d.id === docId);
    if (!doc) {
      throw new DocumentNotFoundError(docId);
    }
    return doc;
  }

  add(input: AddDocumentInput): Document {
    const title = (input.title ?? '').trim();
    const content = input.content ?? '';
    const nodePath = (input.nodePath ?? '').trim();

    if (title === '') {
      throw new KBValidationError('Document "title" is required and cannot be empty.');
    }
    if (!nodePath.startsWith('/')) {
      throw new KBValidationError(`Document "nodePath" must start with "/", got "${nodePath}".`);
    }

    const doc: Document = {
      id: this.nextId(),
      title,
      content,
      nodePath,
      tags: (input.tags ?? []).map((t) => t.trim()).filter((t) => t.length > 0)
    };

    this.documents.push(doc);
    return doc;
  }

  private nextId(): string {
    let n = this.documents.length + 1;
    let candidate = `doc-${String(n).padStart(3, '0')}`;
    const existing = new Set(this.documents.map((d) => d.id));
    while (existing.has(candidate)) {
      n += 1;
      candidate = `doc-${String(n).padStart(3, '0')}`;
    }
    return candidate;
  }
}

function matchDocument(doc: Document, term: string): SearchMatchType | undefined {
  if (doc.title.toLowerCase().includes(term)) return 'title';
  if (doc.tags.some((tag) => tag.toLowerCase().includes(term))) return 'tag';
  if (doc.content.toLowerCase().includes(term)) return 'content';
  return undefined;
}
