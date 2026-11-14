import { describe, expect, it, vi } from 'vitest';
import { fetchOpenSubtitle } from './fetchOpenSubtitle';

const ACCOUNT = { key: 'a-key', username: '', password: '' };

/**
 * A subtitle service that gives a link, and the file at the link.
 */
const serving = (file: () => Response) =>
  vi.fn((url: string | URL | Request) =>
    Promise.resolve(
      (url instanceof Request ? url.url : url.toString()).endsWith('/download')
        ? Response.json({ link: 'https://files.example/one.srt' })
        : file(),
    ),
  );

describe('fetchOpenSubtitle', () => {
  it('downloads the subtitle file', async () => {
    expect(
      await fetchOpenSubtitle(
        ACCOUNT,
        '7',
        serving(() => new Response('hello')),
      ),
    ).toEqual({
      kind: 'downloaded',
      bytes: new TextEncoder().encode('hello'),
      extension: 'srt',
    });
  });

  it('refuses a file bigger than any subtitle would be', async () => {
    expect(
      await fetchOpenSubtitle(
        ACCOUNT,
        '7',
        serving(() => new Response('x'.repeat(6 * 1024 * 1024))),
      ),
    ).toBeNull();
  });
});
