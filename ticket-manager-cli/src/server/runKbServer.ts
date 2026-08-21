#!/usr/bin/env node
import { startKbServer } from './kbServer';

/**
 * Standalone entry point: `npm run kb-server` (or `npm run dev:kb-server`).
 * Starts the mock KB HTTP server on PORT (default 4000) so the CLI can be
 * run against it with:
 *   KB_CLIENT=http KB_API_URL=http://localhost:4000 tickets kb search "..."
 */
async function main(): Promise<void> {
  const port = process.env.PORT ? Number(process.env.PORT) : 4000;
  const { port: actualPort } = await startKbServer(port);
  console.log(`Mock KB server listening on http://localhost:${actualPort}`);
  console.log('Routes: POST /search, /list, /retrieve, /add');
}

main().catch((err) => {
  console.error(`Failed to start KB server: ${(err as Error).message}`);
  process.exit(1);
});
