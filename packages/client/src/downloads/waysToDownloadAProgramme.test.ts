import { describe, expect, it } from 'vitest';
import { MediaSummarySchema } from '@ValenceContracts/schemas/Library';
import { waysToDownloadAProgramme } from './waysToDownloadAProgramme';

const S1E1 = '3fa85f64-5717-4562-b3fc-2c963f66af11';

const S1E2 = '3fa85f64-5717-4562-b3fc-2c963f66af12';

const S2E1 = '3fa85f64-5717-4562-b3fc-2c963f66af21';

const anEpisode = (id: string) =>
  MediaSummarySchema.parse({
    id,
    libraryId: '3fa85f64-5717-4562-b3fc-2c963f66afa7',
    title: id,
    year: null,
    durationSeconds: 1800,
    width: 1920,
    height: 1080,
    videoCodec: 'hevc',
    videoRange: 'SDR',
    addedAt: '2026-01-01T00:00:00.000Z',
  });

const TWO_SEASONS = {
  seasons: [
    { seasonNumber: 1, episodes: [anEpisode(S1E1), anEpisode(S1E2)] },
    { seasonNumber: 2, episodes: [anEpisode(S2E1)] },
  ],
};

describe('waysToDownloadAProgramme', () => {
  it('offers the season on screen first, then every season, then picking', () => {
    expect(waysToDownloadAProgramme(TWO_SEASONS, 2).map((way) => way.label)).toEqual([
      'Season 2 · 1 episode',
      'Every season · 3 episodes',
      'Choose episodes…',
    ]);
  });

  it('asks for just the season on screen’s episodes', () => {
    expect(waysToDownloadAProgramme(TWO_SEASONS, 1)[0]).toEqual({
      kind: 'these',
      label: 'Season 1 · 2 episodes',
      mediaIds: [S1E1, S1E2],
    });
  });

  it('leaves every season to the server, so it takes whatever the programme holds', () => {
    expect(waysToDownloadAProgramme(TWO_SEASONS, 1)[1]).toMatchObject({ mediaIds: undefined });
  });

  it('does not offer one season of a programme that only has one, which is every season', () => {
    expect(
      waysToDownloadAProgramme({ seasons: [TWO_SEASONS.seasons[0]!] }, 1).map((way) => way.label),
    ).toEqual(['Every episode · 2 episodes', 'Choose episodes…']);
  });

  it('offers no season where none is on screen', () => {
    expect(waysToDownloadAProgramme(TWO_SEASONS, null)).toHaveLength(2);
  });
});
