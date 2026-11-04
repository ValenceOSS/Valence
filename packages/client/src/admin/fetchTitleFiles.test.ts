import { afterEach, describe, expect, it, vi } from 'vitest';
import { aMediaSummary } from '@ValenceClient/testing/aMediaSummary';
import { fetchTitleFiles } from './fetchTitleFiles';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('fetchTitleFiles', () => {
  it('reads every file of a title through one of them', async () => {
    const file = aMediaSummary({ id: '00000000-0000-4000-8000-000000000001' });

    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(new Response(JSON.stringify({ files: [file] })))),
    );

    await expect(fetchTitleFiles(file.id)).resolves.toMatchObject([{ id: file.id }]);
  });
});
