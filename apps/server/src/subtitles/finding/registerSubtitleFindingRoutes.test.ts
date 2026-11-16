import { OpenAPIHono } from '@hono/zod-openapi';
import { describe, expect, it, vi } from 'vitest';
import { NO_SUBTITLE_FINDER } from './NO_SUBTITLE_FINDER';
import { registerSubtitleFindingRoutes } from './registerSubtitleFindingRoutes';
import type { SubtitleFinder } from './SubtitleFinder';

const TITLE = '00000000-0000-4000-8000-000000000001';

const READY = {
  state: 'ready' as const,
  sites: ['subdl' as const],
  languages: ['en'],
  server: null,
};

/**
 * The routes over a finder that can always search, for somebody who holds the permissions given,
 * asking from this server or passed through from a linked one.
 *
 * @param holds - The permissions they hold.
 * @param isLinked - Whether the request was passed through from a linked server.
 * @returns The application, and the finder.
 */
const routes = (holds: readonly string[], isLinked = false) => {
  const finder: SubtitleFinder = {
    ...NO_SUBTITLE_FINDER,
    finding: vi.fn(() => Promise.resolve(READY)),
    fetch: vi.fn(() => Promise.resolve({ kind: 'notAllowed' as const })),
  };
  const app = new OpenAPIHono();

  registerSubtitleFindingRoutes(app, {
    finder,
    requires: (_, permission) => Promise.resolve(holds.includes(permission)),
    isFromALinkedServer: () => isLinked,
  });

  return { app, finder };
};

describe('registerSubtitleFindingRoutes', () => {
  it('says whether subtitles can be found to anybody who may find them', async () => {
    const answered = await routes(['media.subtitles']).app.request(
      `/api/media/${TITLE}/subtitles/finding`,
    );

    expect(answered.status).toBe(200);
    expect(await answered.json()).toEqual(READY);
  });

  it('refuses somebody who may not find subtitles', async () => {
    const answered = await routes([]).app.request(`/api/media/${TITLE}/subtitles/finding`);

    expect(answered.status).toBe(403);
  });

  it('lets a linked server’s people through, since their server was let in already', async () => {
    const answered = await routes([], true).app.request(`/api/media/${TITLE}/subtitles/finding`);

    expect(answered.status).toBe(200);
  });

  it('says a fetch a linked server would not allow was not allowed', async () => {
    const answered = await routes(['media.subtitles']).app.request(
      `/api/media/${TITLE}/subtitles/found`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ source: 'subdl', id: 'x', language: 'en' }),
      },
    );

    expect(answered.status).toBe(403);
    expect(await answered.json()).toMatchObject({
      code: 'error.linking.yourServerMayNotFindSubtitlesHere',
    });
  });
});
