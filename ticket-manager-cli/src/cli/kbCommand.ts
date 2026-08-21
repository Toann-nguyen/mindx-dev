import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import { createKBClient } from '../kb/kbClientFactory';
import { printJson } from './output';
import { Document, SearchResult } from '../kb/types';
import { AppError } from '../models/errors';

function splitTags(value: string | undefined): string[] | undefined {
  if (value === undefined) return undefined;
  return value
    .split(',')
    .map((t) => t.trim())
    .filter((t) => t.length > 0);
}

function printSearchResults(results: SearchResult[], json: boolean): void {
  if (json) {
    printJson(results);
    return;
  }
  if (results.length === 0) {
    console.log('No matching documents found.');
    return;
  }
  for (const r of results) {
    console.log(`${r.id}  (${r.matchType})  ${r.nodePath}  ${r.title}`);
  }
}

function printDocumentList(docs: Document[], json: boolean): void {
  if (json) {
    printJson(docs);
    return;
  }
  if (docs.length === 0) {
    console.log('No documents found.');
    return;
  }
  for (const d of docs) {
    console.log(`${d.id}  ${d.nodePath}  ${d.title}  [${d.tags.join(', ')}]`);
  }
}

function printDocumentDetail(doc: Document, json: boolean): void {
  if (json) {
    printJson(doc);
    return;
  }
  console.log(`ID:       ${doc.id}`);
  console.log(`Title:    ${doc.title}`);
  console.log(`Node:     ${doc.nodePath}`);
  console.log(`Tags:     ${doc.tags.length > 0 ? doc.tags.join(', ') : '(none)'}`);
  console.log('Content:');
  console.log(doc.content);
}

export function registerKbCommand(program: Command): void {
  const kb = program.command('kb').description('Query the Knowledge Base (mock or HTTP, see KB_CLIENT)');

  kb.command('search')
    .description('Search documents by keyword')
    .argument('<query>', 'Search text')
    .option('--top-k <n>', 'Max number of results', (v) => parseInt(v, 10), 5)
    .action(async function (this: Command, query: string, opts) {
      const globalOpts = this.optsWithGlobals();
      const client = createKBClient();
      const results = await client.search({ query, topK: opts.topK });
      printSearchResults(results, Boolean(globalOpts.json));
    });

  kb.command('list')
    .description('List documents, optionally filtered by node path')
    .option('--node <nodePath>', 'Node path to list, e.g. /templates/email')
    .option('--limit <n>', 'Max number of results', (v) => parseInt(v, 10), 10)
    .action(async function (this: Command, opts) {
      const globalOpts = this.optsWithGlobals();
      const client = createKBClient();
      const docs = await client.list({ nodePath: opts.node, limit: opts.limit });
      printDocumentList(docs, Boolean(globalOpts.json));
    });

  kb.command('retrieve')
    .description('Retrieve a document by id')
    .argument('<docId>', 'Document id, e.g. doc-001')
    .action(async function (this: Command, docId: string) {
      const globalOpts = this.optsWithGlobals();
      const client = createKBClient();
      const doc = await client.retrieve(docId);
      printDocumentDetail(doc, Boolean(globalOpts.json));
    });

  kb.command('add')
    .description('Add a new document from a local file')
    .requiredOption('--file <path>', 'Path to a local file whose content becomes the document body')
    .requiredOption('--path <nodePath>', 'Node path to file the document under, e.g. /templates/sms')
    .option('--title <title>', 'Document title (default: file name without extension)')
    .option('--tags <tags>', 'Comma-separated tags')
    .action(async function (this: Command, opts) {
      const globalOpts = this.optsWithGlobals();
      let content: string;
      try {
        content = fs.readFileSync(opts.file, 'utf-8');
      } catch {
        throw new AppError(`KB add failed: file not found: ${opts.file}`, 1);
      }
      const title = opts.title ?? path.basename(opts.file, path.extname(opts.file));
      const client = createKBClient();
      const doc = await client.add({
        title,
        content,
        nodePath: opts.path,
        tags: splitTags(opts.tags)
      });
      printDocumentDetail(doc, Boolean(globalOpts.json));
    });
}
