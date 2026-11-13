import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { OpenAPIHono } from '@hono/zod-openapi';
import { describe, expect, it } from 'vitest';
import { serveStrings } from './serveStrings';

/**
 * A server with a German strings file to serve.
 *
 * @returns The application.
 */
const aServer = (): OpenAPIHono => {
  const folder = mkdtempSync(join(tmpdir(), 'strings-'));

  writeFileSync(
    join(folder, 'strings-de.json'),
    JSON.stringify([{ handler: 'common.cancel', text: 'Abbrechen', context: 'A button.' }]),
  );

  const app = new OpenAPIHono();

  serveStrings(app, { stringsFolder: folder });

  return app;
};

describe('serveStrings', () => {
  it('answers a language’s words by handler, without the translators’ notes', async () => {
    const answer = await aServer().request('/api/strings/de');

    expect(answer.status).toBe(200);
    expect(await answer.json()).toEqual({ 'common.cancel': 'Abbrechen' });
    expect(answer.headers.get('ETag')).not.toBeNull();
  });

  it('tells an app holding the same words that nothing has changed', async () => {
    const app = aServer();
    const first = await app.request('/api/strings/de');
    const tag = first.headers.get('ETag') ?? '';

    expect(
      (await app.request('/api/strings/de', { headers: { 'If-None-Match': tag } })).status,
    ).toBe(304);
  });

  it('refuses a language Valence is not translated into', async () => {
    expect((await aServer().request('/api/strings/xx')).status).toBe(404);
    expect((await aServer().request('/api/strings/..%2Fsecrets')).status).toBe(404);
  });
});
