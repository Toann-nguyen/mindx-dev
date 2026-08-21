import { KBClient } from './types';
import { MockKBClient } from './MockKBClient';

export const DEFAULT_KB_API_URL = 'http://localhost:4000';

/**
 * Builds the KBClient to use, switchable via the KB_CLIENT environment
 * variable ("mock" | "http", default "mock"). In the mock-only phase of Week 3
 * (Days 1-2) only the in-memory MockKBClient exists; the "http" branch is
 * added later when HTTPKBClient lands. See docs/plans/week-3/tasks.md,
 * "Client switching via environment variable".
 */
export function createKBClient(env: NodeJS.ProcessEnv = process.env): KBClient {
  const mode = (env.KB_CLIENT ?? 'mock').toLowerCase();

  if (mode === 'mock') {
    return new MockKBClient();
  }

  throw new Error(
    `KB_CLIENT="${mode}" is not supported yet -- only "mock" is available in this phase.`
  );
}
