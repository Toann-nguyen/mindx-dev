/**
 * Domain types for the Knowledge Base integration (Week 3).
 * Mirrors the interfaces documented in docs/plans/week-3/architecture.md.
 */

export interface Document {
  id: string; // "doc-001"
  title: string; // "Customer Response Template"
  content: string; // Full markdown content
  nodePath: string; // "/templates/email"
  tags: string[]; // ["template", "email"]
}

export type SearchMatchType = 'title' | 'content' | 'tag';

/** A single hit returned by KBClient#search. Matches the API contract's /search response shape. */
export interface SearchResult {
  id: string;
  title: string;
  nodePath: string;
  /**
   * Which part of the document matched the query. MockKBClient computes this
   * locally; HTTPKBClient's server also reports it (see server/kbServer.ts)
   * so both clients behave the same way for callers.
   */
  matchType: SearchMatchType;
}

export interface KBQuery {
  query: string;
  topK?: number;
}

export interface KBListQuery {
  nodePath?: string;
  limit?: number;
}

export interface AddDocumentInput {
  title: string;
  content: string;
  nodePath: string;
  tags?: string[];
}

/**
 * Contract every KB client (mock or HTTP) must implement.
 * CLI commands (src/cli/kbCommand.ts) only ever depend on this interface,
 * never on a concrete client -- that's what makes MockKBClient and
 * HTTPKBClient swappable via KB_CLIENT.
 */
export interface KBClient {
  search(query: KBQuery): Promise<SearchResult[]>;
  list(query?: KBListQuery): Promise<Document[]>;
  retrieve(docId: string): Promise<Document>;
  add(input: AddDocumentInput): Promise<Document>;
}
