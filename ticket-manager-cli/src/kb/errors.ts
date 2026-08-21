import { AppError } from '../models/errors';

/** A requested document does not exist in the KB. */
export class DocumentNotFoundError extends AppError {
  constructor(docId: string) {
    super(`Document not found: "${docId}"`, 1);
  }
}

/** Input for an `add` (or search/list) request failed validation. */
export class KBValidationError extends AppError {
  constructor(message: string) {
    super(message, 1);
  }
}

/** HTTPKBClient could not reach the KB server, or the server returned an unexpected response. */
export class KBConnectionError extends AppError {
  constructor(message: string) {
    super(message, 1);
  }
}
