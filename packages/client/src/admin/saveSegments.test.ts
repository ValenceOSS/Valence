import { afterEach, describe, expect, it, vi } from 'vitest';
import { saveSegments } from './saveSegments';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('saveSegments', () => {
  it('puts every marker, and reads back what the file has now', async () => {
    const intro = { kind: 'intro' as const, startSeconds: 10, endSeconds: 70 };
    const fetching = vi.fn((_url: string, _init?: RequestInit) =>
      Promise.resolve(
        new Response(JSON.stringify({ segments: [{ ...intro, source: 'manual' }] }), {
          status: 200,
        }),
      ),
    );

    vi.stubGlobal('fetch', fetching);

    await expect(saveSegments('file', [intro])).resolves.toEqual([{ ...intro, source: 'manual' }]);
    expect(fetching.mock.calls[0]?.[1]).toMatchObject({
      method: 'PUT',
      body: JSON.stringify({ segments: [intro] }),
    });
  });

  it('passes on why they were refused', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(new Response(JSON.stringify({ error: 'No.' }), { status: 400 }))),
    );

    await expect(saveSegments('file', [])).resolves.toEqual({ problem: 'No.' });
  });
});
