import { describe, expect, it } from 'vitest';
import { unwatchedByShow } from './unwatchedByShow';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';

const episode = (id: string, seriesId: string | null, seriesTitle: string | null) =>
  ({ id, seriesId, seriesTitle }) as const satisfies Partial<MediaSummary>;

const finished = (mediaId: string) => ({
  mediaId,
  positionSeconds: 1,
  durationSeconds: 1,
  isFinished: true,
  updatedAt: '2026-09-24T00:00:00.000Z',
});

describe('unwatchedByShow', () => {
  it('counts what is left of each programme, by series or by name, and leaves films out', () => {
    const items = [
      episode('a1', 's1', 'Severance'),
      episode('a2', 's1', 'Severance'),
      episode('b1', null, 'From'),
      episode('f1', null, null),
    ].map((one): MediaSummary => ({
      libraryId: 'l',
      title: one.id,
      year: null,
      durationSeconds: 1,
      width: 1,
      height: 1,
      videoCodec: 'h264',
      videoRange: 'SDR',
      addedAt: '2026-09-24T00:00:00.000Z',
      hasPoster: false,
      hasBackdrop: false,
      hasLogo: false,
      seasonNumber: null,
      episodeNumber: null,
      ...one,
    }));

    const left = unwatchedByShow(items, (mediaId) => finished(mediaId).mediaId === 'a1');

    expect(left.get('s1')).toBe(1);
    expect(left.get('From')).toBe(1);
    expect(left.size).toBe(2);
  });
});
