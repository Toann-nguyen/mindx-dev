import * as fs from 'fs';
import * as path from 'path';
import { Ticket } from '../models/Ticket';
import { StorageError } from '../models/errors';

export class TicketRepository {
  constructor(private readonly filePath: string) {}

  readAll(): Ticket[] {
    let raw: string;
    try {
      raw = fs.readFileSync(this.filePath, 'utf-8');
    } catch (err) {
      if (isErrnoException(err) && err.code === 'ENOENT') {
        return [];
      }
      throw new StorageError(
        `Could not read tickets file at "${this.filePath}": ${(err as Error).message}`
      );
    }

    if (raw.trim() === '') {
      return [];
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch (err) {
      throw new StorageError(
        `Tickets file at "${this.filePath}" contains invalid JSON and could not be read. ` +
          `Fix or remove the file, then try again. (${(err as Error).message})`
      );
    }

    if (!Array.isArray(parsed)) {
      throw new StorageError(
        `Tickets file at "${this.filePath}" is malformed: expected a JSON array of tickets.`
      );
    }

    return parsed as Ticket[];
  }

  writeAll(tickets: Ticket[]): void {
    const dir = path.dirname(this.filePath);
    fs.mkdirSync(dir, { recursive: true });

    const tmpPath = `${this.filePath}.${process.pid}.${Date.now()}.tmp`;
    fs.writeFileSync(tmpPath, JSON.stringify(tickets, null, 2), 'utf-8');
    fs.renameSync(tmpPath, this.filePath);
  }
}

function isErrnoException(err: unknown): err is NodeJS.ErrnoException {
  return typeof err === 'object' && err !== null && 'code' in err;
}
