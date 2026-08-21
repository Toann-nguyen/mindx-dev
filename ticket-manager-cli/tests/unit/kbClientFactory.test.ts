import { MockKBClient } from '../../src/kb/MockKBClient';
import { HTTPKBClient } from '../../src/kb/HTTPKBClient';
import { createKBClient } from '../../src/kb/kbClientFactory';

/**
 * Unit tests for the KB_CLIENT environment switch. These verify that the
 * single factory entry point wires up the correct concrete client -- the
 * behaviour the Week 3 acceptance criterion "swappable via environment
 * variable" depends on.
 */
describe('createKBClient (KB_CLIENT switching)', () => {
  it('returns a MockKBClient when KB_CLIENT is "mock" (and is the default)', () => {
    expect(createKBClient({ KB_CLIENT: 'mock' })).toBeInstanceOf(MockKBClient);
    expect(createKBClient({})).toBeInstanceOf(MockKBClient);
  });

  it('returns an HTTPKBClient when KB_CLIENT is "http"', () => {
    const client = createKBClient({ KB_CLIENT: 'http', KB_API_URL: 'http://localhost:4000' });
    expect(client).toBeInstanceOf(HTTPKBClient);
  });

  it('is case-insensitive about the mode', () => {
    expect(createKBClient({ KB_CLIENT: 'MOCK' })).toBeInstanceOf(MockKBClient);
    expect(createKBClient({ KB_CLIENT: 'HTTP' })).toBeInstanceOf(HTTPKBClient);
  });

  it('throws for an unknown KB_CLIENT value', () => {
    expect(() => createKBClient({ KB_CLIENT: 'grpc' })).toThrow(/not supported|grpc/i);
  });
});
