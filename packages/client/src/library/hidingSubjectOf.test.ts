import { describe, expect, it } from 'vitest';
import { hidingSubjectOf } from './hidingSubjectOf';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';

const summary = (overrides: Partial<MediaSummary> = {}): MediaSummary => ({
  id: 'media-1',
  libraryId: 'library-1',
  title: 'Arrival',
  year: 2016,
  durationSeconds: 7200,
  width: 1920,
  height: 1080,
  videoCodec: 'hevc',
  videoRange: 'SDR',
  addedAt: '2026-08-10T00:00:00.000Z',
  hasPoster: true,
  hasBackdrop: true,
  hasLogo: false,
  seriesId: null,
  parentId: null,
  extraKind: null,
  versionLabel: null,
  rating: null,
  seriesTitle: null,
  seasonNumber: null,
  episodeNumber: null,
  genres: null,
  ...overrides,
});

describe('what pressing hide means', () => {
  it('hides a film as itself', () => {
    expect(hidingSubjectOf(summary())).toEqual({
      kind: 'item',
      subjectId: 'media-1',
      title: 'Arrival',
    });
  });

  it('hides the whole programme rather than the episode standing for it', () => {
    expect(
      hidingSubjectOf(
        summary({
          id: 'episode-4',
          title: 'The Car Pool Lane',
          seriesId: 'series-1',
          seriesTitle: 'Curb Your Enthusiasm',
          seasonNumber: 4,
        }),
      ),
    ).toEqual({ kind: 'series', subjectId: 'series-1', title: 'Curb Your Enthusiasm' });
  });

  it('calls it by the programme’s name, which is what the question has to say', () => {
    expect(
      hidingSubjectOf(summary({ title: 'An Episode', seriesId: 's', seriesTitle: 'A Programme' })),
    ).toMatchObject({ title: 'A Programme' });
  });

  it('falls back to the episode’s own name where the programme has none', () => {
    expect(hidingSubjectOf(summary({ title: 'An Episode', seriesId: 's' }))).toMatchObject({
      title: 'An Episode',
    });
  });

  it('treats something with a programme title but no identifier as an item', () => {
    expect(hidingSubjectOf(summary({ seriesTitle: 'Unmatched Show' }))).toMatchObject({
      kind: 'item',
      subjectId: 'media-1',
    });
  });
});
