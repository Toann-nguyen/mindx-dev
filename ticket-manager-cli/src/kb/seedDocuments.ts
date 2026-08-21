import { Document } from './types';

/**
 * Seed data shared by MockKBClient and the local mock KB HTTP server, so
 * both "backends" start from the exact same 3 documents. This is what makes
 * the parity tests (tests/integration/kbClientParity.test.ts) meaningful:
 * mock and HTTP clients are exercised against identical data.
 *
 * Matches the "KB Structure" example in docs/plans/week-3/architecture.md:
 * one /templates/email doc, one /team/devops doc, one /docs/guides doc.
 */
export function createSeedDocuments(): Document[] {
  return [
    {
      id: 'doc-001',
      title: 'Customer Response Template',
      content:
        '# Customer Response Template\n\n' +
        'Hi {{customer_name}},\n\n' +
        'Thank you for reaching out. We have received your request and will ' +
        'respond within one business day.\n\n' +
        'Best regards,\nSupport Team',
      nodePath: '/templates/email',
      tags: ['template', 'email', 'support']
    },
    {
      id: 'doc-002',
      title: 'DevOps Team Members',
      content:
        '# DevOps Team\n\n' +
        '- Alice Nguyen - Team Lead\n' +
        '- Binh Tran - SRE\n' +
        '- Chi Le - SRE\n\n' +
        'On-call schedule is published weekly in the team calendar.',
      nodePath: '/team/devops',
      tags: ['team', 'devops']
    },
    {
      id: 'doc-003',
      title: 'Getting Started Guide',
      content:
        '# Getting Started\n\n' +
        '1. Clone the repository\n' +
        '2. Install dependencies\n' +
        '3. Run the test suite\n\n' +
        'See the README for detailed setup instructions.',
      nodePath: '/docs/guides',
      tags: ['guide', 'docs', 'onboarding']
    }
  ];
}
