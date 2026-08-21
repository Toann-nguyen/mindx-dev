import { AddDocumentInput, Document, KBClient, KBListQuery, KBQuery, SearchResult } from './types';
import { KBStore } from './KBStore';
import { createSeedDocuments } from './seedDocuments';

/**
 * In-memory KBClient for local development and tests. Seeded with 2-3
 * realistic documents (see seedDocuments.ts). No network I/O -- safe to use
 * without a running KB server, which is why it's the default (KB_CLIENT=mock).
 */
export class MockKBClient implements KBClient {
  private readonly store: KBStore;

  constructor(seedDocuments: Document[] = createSeedDocuments()) {
    this.store = new KBStore(seedDocuments);
  }

  async search(query: KBQuery): Promise<SearchResult[]> {
    return this.store.search(query);
  }

  async list(query?: KBListQuery): Promise<Document[]> {
    return this.store.list(query);
  }

  async retrieve(docId: string): Promise<Document> {
    return this.store.retrieve(docId);
  }

  async add(input: AddDocumentInput): Promise<Document> {
    return this.store.add(input);
  }
}
