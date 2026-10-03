import { describe, expect, it, vi } from 'vitest';
import { aLinkedAskerAnswering } from '@ValenceServer/testing/aLinkedAskerAnswering';
import { createLinkedSubtitles } from './createLinkedSubtitles';
import type { SubtitleService } from '@ValenceServer/subtitles/SubtitleService';

const TRACK = {
  id: 'en',
  language: 'en',
  label: 'English',
  format: 'srt',
  isForced: false,
  isHearingImpaired: false,
  delivery: 'text' as const,
  streamIndex: null,
};

const aLocal = (): SubtitleService => ({
  list: vi.fn(() => Promise.resolve([])),
  read: vi.fn(() => Promise.resolve('here')),
  readCues: vi.fn(() => Promise.resolve([])),
});

const linkedTitleOf = (mediaId: string) =>
  Promise.resolve(mediaId === 'theirs' ? { serverId: 'films', remoteId: 'r1' } : null);

describe('createLinkedSubtitles', () => {
  it('reads this server’s own titles’ subtitles as it always has', async () => {
    const local = aLocal();
    const subtitles = createLinkedSubtitles(
      local,
      linkedTitleOf,
      aLinkedAskerAnswering(() => null),
    );

    expect(await subtitles.read('mine', 'en')).toBe('here');
    expect(await subtitles.list('mine')).toEqual([]);
    expect(await subtitles.readCues('mine', 'en')).toEqual([]);
  });

  it('lists, reads and styles a linked title’s subtitles by asking the server that has them', async () => {
    const asker = aLinkedAskerAnswering((_, route) =>
      route.endsWith('/subtitles')
        ? Response.json({ tracks: [TRACK] })
        : route.endsWith('/cues')
          ? Response.json({ cues: [] })
          : new Response('WEBVTT'),
    );
    const subtitles = createLinkedSubtitles(aLocal(), linkedTitleOf, asker);

    expect(await subtitles.list('theirs')).toEqual([TRACK]);
    expect(await subtitles.read('theirs', 'en')).toBe('WEBVTT');
    expect(await subtitles.readCues('theirs', 'en')).toEqual([]);
    expect(asker.asked.map((one) => one.route)).toEqual([
      '/api/media/r1/subtitles',
      '/api/media/r1/subtitles/en',
      '/api/media/r1/subtitles/en/cues',
    ]);
  });

  it('reads nothing where the linked server cannot be reached', async () => {
    const subtitles = createLinkedSubtitles(
      aLocal(),
      linkedTitleOf,
      aLinkedAskerAnswering(() => null),
    );

    expect(await subtitles.list('theirs')).toBeNull();
    expect(await subtitles.read('theirs', 'en')).toBeNull();
    expect(await subtitles.readCues('theirs', 'en')).toBeNull();
  });
});
