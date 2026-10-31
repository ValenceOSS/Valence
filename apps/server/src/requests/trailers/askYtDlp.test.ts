import { describe, expect, it, vi } from 'vitest';
import { askYtDlp } from './askYtDlp';

const SETUP = { binary: 'yt-dlp', cookies: null, runtime: '/usr/local/bin/node' };

/**
 * A yt-dlp that answers as it is told.
 *
 * @param output - What it writes.
 * @param failure - What it failed with, or nothing.
 * @param said - What it complains of.
 * @returns The way to run it.
 */
const aYtDlp = (
  output = '',
  failure: { code: string | null; message: string } | null = null,
  said = '',
) =>
  vi.fn((_binary: string, _args: readonly string[]) => Promise.resolve({ failure, output, said }));

describe('askYtDlp', () => {
  it('reads the address yt-dlp found', async () => {
    const run = aYtDlp('https://rr1.googlevideo.com/videoplayback?id=1\n');

    expect(await askYtDlp('dQw4w9WgXcQ', SETUP, run)).toEqual({
      kind: 'found',
      url: 'https://rr1.googlevideo.com/videoplayback?id=1',
    });
  });

  it('runs the challenges in the server’s own Node, with the cookies it was given', async () => {
    const run = aYtDlp('https://x\n');

    await askYtDlp('dQw4w9WgXcQ', { ...SETUP, cookies: '/config/youtube.txt' }, run);

    const args = run.mock.lastCall?.[1] ?? [];

    expect(args).toEqual(
      expect.arrayContaining(['node:/usr/local/bin/node', '--cookies', '/config/youtube.txt']),
    );
    expect(args.at(-1)).toBe('dQw4w9WgXcQ');
  });

  it('says why it could not find one', async () => {
    const run = aYtDlp(
      '',
      { code: null, message: 'failed' },
      'Sign in to confirm you’re not a bot',
    );

    expect(await askYtDlp('dQw4w9WgXcQ', SETUP, run)).toEqual({
      kind: 'failed',
      why: 'Sign in to confirm you’re not a bot',
    });
  });

  it('says so where yt-dlp is not installed', async () => {
    const run = aYtDlp('', { code: 'ENOENT', message: 'spawn yt-dlp ENOENT' });

    expect(await askYtDlp('dQw4w9WgXcQ', SETUP, run)).toEqual({
      kind: 'failed',
      why: 'yt-dlp is not installed',
    });
  });

  it('runs nothing for what is not a YouTube video id', async () => {
    const run = aYtDlp();

    expect(await askYtDlp('--exec rm', SETUP, run)).toEqual({
      kind: 'failed',
      why: 'not a YouTube video id',
    });
    expect(run).not.toHaveBeenCalled();
  });
});
