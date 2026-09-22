import { MediaSummarySchema } from '@ValenceContracts/schemas/Library';
import { theSeasonToOpenOn } from './theSeasonToOpenOn';
import type { WatchProgress } from '@ValenceContracts/schemas/WatchProgress';

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

const ONE = '3fa85f64-5717-4562-b3fc-2c963f66af01';
const TWO = '3fa85f64-5717-4562-b3fc-2c963f66af02';
const EXTRA = '3fa85f64-5717-4562-b3fc-2c963f66af00';

const SEASONS = [
  { seasonNumber: 0, episodes: [anEpisode(EXTRA)] },
  { seasonNumber: 1, episodes: [anEpisode(ONE)] },
  { seasonNumber: 2, episodes: [anEpisode(TWO)] },
];

const finished = (mediaId: string): WatchProgress => ({
  mediaId,
  positionSeconds: 1800,
  durationSeconds: 1800,
  isFinished: true,
  updatedAt: '2026-01-01T00:00:00.000Z',
});

describe('theSeasonToOpenOn', () => {
  it('opens a programme nobody has started on its first season', () => {
    expect(theSeasonToOpenOn(SEASONS, new Map())?.seasonNumber).toBe(1);
  });

  it('opens on the season somebody is up to', () => {
    expect(theSeasonToOpenOn(SEASONS, new Map([[ONE, finished(ONE)]]))?.seasonNumber).toBe(2);
  });

  it('never opens on the specials while there are seasons to work through', () => {
    expect(theSeasonToOpenOn(SEASONS, new Map())?.seasonNumber).not.toBe(0);
  });

  it('opens on the specials where they are all there is', () => {
    expect(theSeasonToOpenOn([SEASONS[0]!], new Map())?.seasonNumber).toBe(0);
  });

  it('opens on the first season where everything has been watched', () => {
    const everything = new Map([
      [ONE, finished(ONE)],
      [TWO, finished(TWO)],
    ]);

    expect(theSeasonToOpenOn(SEASONS, everything)?.seasonNumber).toBe(1);
  });

  it('opens on nothing for a programme with no seasons', () => {
    expect(theSeasonToOpenOn([], new Map())).toBeNull();
  });
});
