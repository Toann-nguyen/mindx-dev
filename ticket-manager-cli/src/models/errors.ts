/**
 * Shared error hierarchy for the Ticket Manager domain.
 *
 * CLI commands catch these and translate them into a clear stderr message
 * plus a non-zero exit code (see src/cli/index.ts).
 */

/** Base class for all errors this application raises intentionally (as opposed to bugs). */
export class AppError extends Error {
  /** Process exit code the CLI should use when this error escapes to the top. */
  readonly exitCode: number;

  constructor(message: string, exitCode = 1) {
    super(message);
    this.name = new.target.name;
    this.exitCode = exitCode;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/** Input failed validation (missing required field, invalid enum value, etc). */
export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 1);
  }
}

/** A requested ticket does not exist. */
export class TicketNotFoundError extends AppError {
  constructor(id: string) {
    super(`Ticket not found: "${id}"`, 1);
  }
}

/** The JSON storage file exists but could not be parsed as valid ticket data. */
export class StorageError extends AppError {
  constructor(message: string) {
    super(message, 1);
  }
}
