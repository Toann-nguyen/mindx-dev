import { MockKBClient } from '../../src/kb/MockKBClient';
import { DocumentNotFoundError, KBValidationError } from '../../src/kb/errors';

describe('MockKBClient', () => {
  let client: MockKBClient;

  beforeEach(() => {
    client = new MockKBClient();
  });

  describe('seed data', () => {
    it('is seeded with the 2-3 documents described in the KB structure (email template + team doc)', async () => {
      const docs = await client.list();
      expect(docs.length).toBeGreaterThanOrEqual(2);

      const emailTemplate = docs.find((d) => d.nodePath === '/templates/email');
      const teamDoc = docs.find((d) => d.nodePath.startsWith('/team/'));
      expect(emailTemplate).toBeDefined();
      expect(teamDoc).toBeDefined();
    });
  });

  describe('search', () => {
    it('matches on title (case-insensitive) and reports matchType "title"', async () => {
      const results = await client.search({ query: 'CUSTOMER RESPONSE' });
      expect(results).toHaveLength(1);
      expect(results[0]).toMatchObject({
        id: 'doc-001',
        nodePath: '/templates/email',
        matchType: 'title'
      });
    });

    it('matches on tags and reports matchType "tag" when the term is only in tags', async () => {
      const results = await client.search({ query: 'onboarding' });
      expect(results).toHaveLength(1);
      expect(results[0]).toMatchObject({ id: 'doc-003', matchType: 'tag' });
    });

    it('matches on content and reports matchType "content" when the term is only in the body', async () => {
      const results = await client.search({ query: 'clone the repository' });
      expect(results).toHaveLength(1);
      expect(results[0]).toMatchObject({ id: 'doc-003', matchType: 'content' });
    });

    it('respects topK', async () => {
      const results = await client.search({ query: 'e', topK: 1 }); // broad term, many hits
      expect(results.length).toBeLessThanOrEqual(1);
    });

    it('returns an empty array when nothing matches', async () => {
      const results = await client.search({ query: 'no-such-term-xyz' });
      expect(results).toEqual([]);
    });

    it('rejects an empty query', async () => {
      await expect(client.search({ query: '' })).rejects.toThrow(KBValidationError);
      await expect(client.search({ query: '   ' })).rejects.toThrow(KBValidationError);
    });
  });

  describe('list', () => {
    it('returns all documents when no nodePath filter is given', async () => {
      const docs = await client.list();
      expect(docs.length).toBeGreaterThanOrEqual(3);
    });

    it('filters by exact nodePath', async () => {
      const docs = await client.list({ nodePath: '/templates/email' });
      expect(docs).toHaveLength(1);
      expect(docs[0].id).toBe('doc-001');
    });

    it('filters by nodePath prefix (parent node)', async () => {
      const docs = await client.list({ nodePath: '/team' });
      expect(docs.some((d) => d.nodePath === '/team/devops')).toBe(true);
    });

    it('respects limit', async () => {
      const docs = await client.list({ limit: 1 });
      expect(docs).toHaveLength(1);
    });

    it('returns an empty array for a nodePath with no documents', async () => {
      const docs = await client.list({ nodePath: '/nowhere' });
      expect(docs).toEqual([]);
    });
  });

  describe('retrieve', () => {
    it('returns the full document (including content) for a known id', async () => {
      const doc = await client.retrieve('doc-001');
      expect(doc.id).toBe('doc-001');
      expect(doc.title).toBe('Customer Response Template');
      expect(doc.content.length).toBeGreaterThan(0);
    });

    it('throws DocumentNotFoundError for an unknown id', async () => {
      await expect(client.retrieve('doc-999')).rejects.toThrow(DocumentNotFoundError);
      await expect(client.retrieve('doc-999')).rejects.toThrow(/doc-999/);
    });
  });

  describe('add', () => {
    it('adds a new document and assigns it a new id', async () => {
      const doc = await client.add({
        title: 'SMS Template',
        content: 'Your code is {{code}}',
        nodePath: '/templates/sms',
        tags: [' sms ', 'template', '']
      });

      expect(doc.id).toBe('doc-004');
      expect(doc.title).toBe('SMS Template');
      expect(doc.tags).toEqual(['sms', 'template']); // trimmed, empties dropped

      const retrieved = await client.retrieve(doc.id);
      expect(retrieved).toEqual(doc);
    });

    it('makes the new document show up in list() and search()', async () => {
      await client.add({ title: 'Vacation Policy', content: 'PTO details', nodePath: '/team/hr', tags: ['hr'] });

      const listed = await client.list({ nodePath: '/team/hr' });
      expect(listed).toHaveLength(1);

      const found = await client.search({ query: 'vacation' });
      expect(found).toHaveLength(1);
      expect(found[0].matchType).toBe('title');
    });

    it('rejects an empty title', async () => {
      await expect(
        client.add({ title: '', content: 'x', nodePath: '/team/hr' })
      ).rejects.toThrow(KBValidationError);
    });

    it('rejects a nodePath that does not start with "/"', async () => {
      await expect(
        client.add({ title: 'Bad path', content: 'x', nodePath: 'team/hr' })
      ).rejects.toThrow(KBValidationError);
    });
  });
});
