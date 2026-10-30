import { render } from '@testing-library/react-native';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { MediaSummarySchema } from '@ValenceContracts/schemas/Library';
import { AnEpisodeList } from './AnEpisodeList';

/**
 * A season of so many episodes, each its own row.
 *
 * @param count - How many episodes.
 * @returns The rows.
 */
const aSeasonOf = (count: number) =>
  Array.from({ length: count }, (_, at) => ({
    key: `e${at.toString()}`,
    at: at + 1,
    listed: null,
    airs: '',
    episode: MediaSummarySchema.parse({
      id: `3fa85f64-5717-4562-b3fc-${(at + 1).toString().padStart(12, '0')}`,
      libraryId: '3fa85f64-5717-4562-b3fc-2c963f66afa7',
      title: `Episode ${(at + 1).toString()}`,
      year: null,
      durationSeconds: 1440,
      width: 1920,
      height: 1080,
      videoCodec: 'hevc',
      videoRange: 'SDR',
      addedAt: '2026-01-01T00:00:00.000Z',
      episodeNumber: at + 1,
    }),
  }));

beforeEach(() => {
  installPlatform(aFakePlatform());
});

describe('AnEpisodeList', () => {
  it('draws the first of a long season at once and the rest of it after', async () => {
    const drawn = await render(
      <AnEpisodeList
        rows={aSeasonOf(100)}
        watchedOf={() => 0}
        resumeOf={() => null}
        onWatch={jest.fn()}
        onLookAt={jest.fn()}
        onMarkWatched={jest.fn()}
      />,
    );

    expect(drawn.getByText('20. Episode 20')).toBeTruthy();

    expect(await drawn.findByText('100. Episode 100', {}, { timeout: 4000 })).toBeTruthy();
  });
});
