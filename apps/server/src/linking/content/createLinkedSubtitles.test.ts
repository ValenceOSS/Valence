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
  readScript: vi.fn(() => Promise.resolve(null)),
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

  it('lists nothing where the linked server cannot be reached', async () => {
    const subtitles = createLinkedSubtitles(
      aLocal(),
      linkedTitleOf,
      aLinkedAskerAnswering(() => null),
    );

    expect(await subtitles.list('theirs')).toBeNull();
  });

  it('fails a read where the linked server cannot be reached, so the player asks again', async () => {
    const subtitles = createLinkedSubtitles(
      aLocal(),
      linkedTitleOf,
      aLinkedAskerAnswering(() => null),
    );

    await expect(subtitles.read('theirs', 'en')).rejects.toThrow();
    await expect(subtitles.readCues('theirs', 'en')).rejects.toThrow();
    await expect(subtitles.readScript('theirs', 'en')).rejects.toThrow();
  });

  it('fails a read the linked server could not answer just now', async () => {
    const subtitles = createLinkedSubtitles(
      aLocal(),
      linkedTitleOf,
      aLinkedAskerAnswering(() => new Response('', { status: 503 })),
    );

    await expect(subtitles.readCues('theirs', 'en')).rejects.toThrow();
  });

  it('reads nothing where the linked server says the track has nothing to give', async () => {
    const subtitles = createLinkedSubtitles(
      aLocal(),
      linkedTitleOf,
      aLinkedAskerAnswering(() => new Response('', { status: 404 })),
    );

    expect(await subtitles.read('theirs', 'en')).toBeNull();
    expect(await subtitles.readCues('theirs', 'en')).toBeNull();
    expect(await subtitles.readScript('theirs', 'en')).toBeNull();
  });
});
