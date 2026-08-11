import { spawn, spawnSync } from 'child_process';
import * as path from 'path';

const CLI_ENTRY = path.join(__dirname, '..', '..', 'dist', 'cli', 'index.js');

export interface CliResult {
  stdout: string;
  stderr: string;
  status: number | null;
}

/**
 * Runs the *built* CLI as a real subprocess (node dist/cli/index.js ...).
 * This is what makes the integration tests "end-to-end": they exercise the
 * exact artifact a user would run, not an in-process import of the source.
 *
 * Uses spawnSync, which blocks this process's event loop until the child
 * exits. That's fine (and simplest) for the `tickets` commands and for `kb`
 * commands against the mock client, since neither depends on anything else
 * running in *this* process. It must NOT be used when the CLI is pointed at
 * an HTTP KB server started in-process (e.g. via startKbServer in the same
 * test file): spawnSync would freeze this process's event loop, the server
 * would never get to handle the request, and the child would hang forever
 * waiting for a response -- a self-deadlock. Use runCliAsync for that case.
 */
export function runCli(args: string[], env: NodeJS.ProcessEnv = {}): CliResult {
  const result = spawnSync(process.execPath, [CLI_ENTRY, ...args], {
    encoding: 'utf-8',
    env: { ...process.env, ...env }
  });
  return {
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
    status: result.status
  };
}

export function runCliJson<T>(args: string[], env: NodeJS.ProcessEnv = {}): T {
  const result = runCli([...args, '--json'], env);
  if (result.status !== 0) {
    throw new Error(`CLI exited with status ${result.status}. stderr: ${result.stderr}`);
  }
  return JSON.parse(result.stdout) as T;
}

/**
 * Same as runCli, but non-blocking (child_process.spawn + a Promise) so this
 * process's event loop keeps running while the child is alive. Required
 * whenever the CLI subprocess needs to talk to a server running in-process
 * (see the big comment on runCli above).
 */
export function runCliAsync(args: string[], env: NodeJS.ProcessEnv = {}): Promise<CliResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [CLI_ENTRY, ...args], {
      env: { ...process.env, ...env }
    });

    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => (stdout += chunk));
    child.stderr.on('data', (chunk) => (stderr += chunk));
    child.on('error', reject);
    child.on('close', (status) => resolve({ stdout, stderr, status }));
  });
}

export async function runCliJsonAsync<T>(args: string[], env: NodeJS.ProcessEnv = {}): Promise<T> {
  const result = await runCliAsync([...args, '--json'], env);
  if (result.status !== 0) {
    throw new Error(`CLI exited with status ${result.status}. stderr: ${result.stderr}`);
  }
  return JSON.parse(result.stdout) as T;
}
