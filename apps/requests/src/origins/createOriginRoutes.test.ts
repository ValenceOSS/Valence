import { describe, expect, it } from 'vitest';
import { createOriginRoutes } from '@ValenceRequests/origins/createOriginRoutes';

describe('createOriginRoutes', () => {
  it('answers which of the files asked about were filed, and by what', async () => {
    const routes = createOriginRoutes((paths) =>
      Promise.resolve(
        Object.fromEntries(
          paths.map((path) => [path, { source: 'download' as const, via: 'SABnzbd' }]),
        ),
      ),
    );
    const answer = await routes.request('/origins', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ paths: ['/a.mkv'] }),
    });

    expect(answer.status).toBe(200);
    expect(await answer.json()).toEqual({
      filed: { '/a.mkv': { source: 'download', via: 'SABnzbd' } },
    });
  });

  it('refuses a body that names no files', async () => {
    const routes = createOriginRoutes(() => Promise.resolve({}));
    const answer = await routes.request('/origins', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ paths: [] }),
    });

    expect(answer.status).toBe(400);
  });
});
