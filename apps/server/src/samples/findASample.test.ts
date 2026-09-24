import { describe, expect, it, vi } from 'vitest';
import { findASample } from './findASample';

const answering = (results: object[], ok = true) =>
  vi.fn<(url: string) => Promise<Response>>(() =>
    Promise.resolve(new Response(JSON.stringify({ results }), { status: ok ? 200 : 503 })),
  );

const PREVIEW = 'https://audio-ssl.itunes.apple.com/itunes-assets/preview.m4a';

describe('findASample', () => {
  it('asks for songs by the artist and album, and plays one from that album', async () => {
    const ask = answering([
      { artistName: 'Drake', collectionName: 'Views', previewUrl: `${PREVIEW}?views` },
      { artistName: 'Drake', collectionName: 'Her Loss (Deluxe)', previewUrl: `${PREVIEW}?loss` },
    ]);

    await expect(findASample(ask, 'Drake', 'Her Loss')).resolves.toBe(`${PREVIEW}?loss`);
    expect(ask.mock.calls[0]?.[0]).toContain('term=Drake+Her+Loss');
  });

  it('falls back to a song by the same artist, and never to somebody else', async () => {
    await expect(
      findASample(
        answering([
          { artistName: 'Somebody Else', collectionName: 'Her Loss', previewUrl: `${PREVIEW}?x` },
          { artistName: 'Drake', collectionName: 'Views', previewUrl: `${PREVIEW}?views` },
        ]),
        'Drake',
        'Her Loss',
      ),
    ).resolves.toBe(`${PREVIEW}?views`);
    await expect(
      findASample(
        answering([{ artistName: 'Somebody Else', previewUrl: `${PREVIEW}?x` }]),
        'Drake',
        'Her Loss',
      ),
    ).resolves.toBeNull();
  });

  it('hands back nothing but an address on Apple’s own servers', async () => {
    await expect(
      findASample(
        answering([
          {
            artistName: 'Drake',
            collectionName: 'Her Loss',
            previewUrl: 'https://evil.example/x.m4a',
          },
        ]),
        'Drake',
        'Her Loss',
      ),
    ).resolves.toBeNull();
  });

  it('finds nothing where the search fails or cannot be read', async () => {
    await expect(findASample(answering([], false), 'Drake', 'Her Loss')).resolves.toBeNull();
    await expect(
      findASample(() => Promise.reject(new Error('offline')), 'Drake', 'Her Loss'),
    ).resolves.toBeNull();
  });
});
