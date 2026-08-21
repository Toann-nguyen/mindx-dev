import { KBClient } from './types';
import { MockKBClient } from './MockKBClient';
import { HTTPKBClient } from './HTTPKBClient';

export const DEFAULT_KB_API_URL = 'http://localhost:4000';

/**
 * Builds the KBClient to use, switchable via the KB_CLIENT environment
 * variable ("mock" | "http", default "mock"). This is the single place the
 * CLI decides which backend to talk to -- see docs/plans/week-3/tasks.md,
 * "Client switching via environment variable".
 */
export function createKBClient(env: NodeJS.ProcessEnv = process.env): KBClient {
  const mode = (env.KB_CLIENT ?? 'mock').toLowerCase();

  switch (mode) {
    case 'mock':
      return new MockKBClient();
    case 'http':
      return new HTTPKBClient(env.KB_API_URL ?? DEFAULT_KB_API_URL);
    default:
      throw new Error(`Unknown KB_CLIENT "${mode}". Expected "mock" or "http".`);
  }
}
