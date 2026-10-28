import { describe, expect, it, vi } from 'vitest';
import { readKeyframesAhead } from './readKeyframesAhead';
import type { KeyframesAhead } from '@ValenceServer/transcoder/TranscoderClient';

const FILMS = [
  { id: 'newest', path: '/media/Newest.mkv' },
  { id: 'older', path: '/media/Older.mkv' },
  { id: 'oldest', path: '/media/Oldest.mkv' },
];

const reading = (answers: Record<string, KeyframesAhead | Error>) => {
  const markRead = vi.fn(() => Promise.resolve());
  const onUnreadable = vi.fn();
  const asked: string[] = [];

  return {
    markRead,
    onUnreadable,
    asked,
    run: () =>
      readKeyframesAhead({
        waiting: () => Promise.resolve(FILMS),
        readAhead: (path) => {
          asked.push(path);

          const answer = answers[path] ?? 'read';

          return answer instanceof Error ? Promise.reject(answer) : Promise.resolve(answer);
        },
        markRead,
        onUnreadable,
        onProgress: () => undefined,
        isCancelled: () => false,
      }),
  };
};

describe('readKeyframesAhead', () => {
  it('reads every waiting film in the order given and marks each', async () => {
    const run = reading({ '/media/Older.mkv': 'kept', '/media/Oldest.mkv': 'skipped' });

    expect(await run.run()).toEqual({
      read: 1,
      kept: 1,
      skipped: 1,
      unreadable: 0,
      isHeldBack: false,
    });
    expect(run.asked).toEqual(FILMS.map((film) => film.path));
    expect(run.markRead.mock.calls).toEqual([['newest'], ['older'], ['oldest']]);
  });

  it('stops where somebody is watching, leaving the rest unmarked for next time', async () => {
    const run = reading({ '/media/Older.mkv': 'later' });

    expect((await run.run()).isHeldBack).toBe(true);
    expect(run.asked).toEqual(['/media/Newest.mkv', '/media/Older.mkv']);
    expect(run.markRead.mock.calls).toEqual([['newest']]);
  });

  it('marks a film that cannot be read, and says which', async () => {
    const run = reading({ '/media/Newest.mkv': 'unreadable' });

    expect((await run.run()).unreadable).toBe(1);
    expect(run.onUnreadable).toHaveBeenCalledWith('/media/Newest.mkv');
    expect(run.markRead).toHaveBeenCalledWith('newest');
  });

  it('marks nothing it was not answered about when the media service fails', async () => {
    const run = reading({ '/media/Older.mkv': new Error('The media service is not answering') });

    await expect(run.run()).rejects.toThrow('not answering');
    expect(run.markRead.mock.calls).toEqual([['newest']]);
  });

  it('stops when the job is cancelled', async () => {
    const markRead = vi.fn(() => Promise.resolve());

    await readKeyframesAhead({
      waiting: () => Promise.resolve(FILMS),
      readAhead: () => Promise.resolve('read'),
      markRead,
      onUnreadable: () => undefined,
      onProgress: () => undefined,
      isCancelled: () => markRead.mock.calls.length >= 1,
    });

    expect(markRead).toHaveBeenCalledTimes(1);
  });
});
