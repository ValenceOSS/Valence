import { render, userEvent } from '@testing-library/react-native';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { MediaSummarySchema } from '@ValenceContracts/schemas/Library';
import { ComingUpSchema } from '@ValenceContracts/schemas/Show';
import { AHomeShelf } from './AHomeShelf';

const LIBRARY = '3fa85f64-5717-4562-b3fc-2c963f66afa7';

const aFilm = MediaSummarySchema.parse({
  id: '3fa85f64-5717-4562-b3fc-2c963f66afa1',
  libraryId: LIBRARY,
  title: 'Arrival',
  year: 2016,
  durationSeconds: 6960,
  width: 1920,
  height: 1080,
  videoCodec: 'hevc',
  videoRange: 'SDR',
  addedAt: '2026-01-01T00:00:00.000Z',
});

const anEpisode = MediaSummarySchema.parse({
  id: '3fa85f64-5717-4562-b3fc-2c963f66afa3',
  libraryId: LIBRARY,
  title: 'Good News About Hell',
  year: 2022,
  durationSeconds: 3300,
  width: 1920,
  height: 1080,
  videoCodec: 'hevc',
  videoRange: 'SDR',
  addedAt: '2026-01-01T00:00:00.000Z',
  seriesId: 'severance',
  seriesTitle: 'Severance',
  seasonNumber: 1,
  episodeNumber: 1,
});

const { shows: upcoming } = ComingUpSchema.parse({
  shows: [
    {
      show: {
        id: 'severance',
        libraryId: LIBRARY,
        title: 'Severance',
        seasonCount: 2,
        episodeCount: 19,
        latestAddedAt: '2026-01-01T00:00:00.000Z',
        coverMediaId: '3fa85f64-5717-4562-b3fc-2c963f66afa2',
      },
      episode: { seasonNumber: 3, episodeNumber: 1, title: 'Hello', airDate: '2026-10-01' },
    },
  ],
});

beforeEach(() => {
  installPlatform(aFakePlatform());
});

describe('AHomeShelf', () => {
  it('draws a row of titles under its name, each opening its page', async () => {
    const onLookAt = jest.fn();
    const drawn = await render(
      <AHomeShelf
        shelf={{ kind: 'rail', rail: { id: 'recent', title: 'Recently added', items: [aFilm] } }}
        upcoming={upcoming}
        progress={new Map()}
        today="2026-09-24"
        onLookAt={onLookAt}
        onLookAtShow={jest.fn()}
      />,
    );

    expect(drawn.getByText('Recently added')).toBeTruthy();

    await userEvent.press(drawn.getByRole('button', { name: 'Arrival' }));

    expect(onLookAt).toHaveBeenCalledWith(aFilm.id);
  });

  it('draws what somebody is part way through as stills, each episode named for its programme', async () => {
    const onLookAt = jest.fn();
    const drawn = await render(
      <AHomeShelf
        shelf={{
          kind: 'rail',
          rail: { id: 'resume', title: 'Continue watching', items: [anEpisode] },
        }}
        upcoming={upcoming}
        progress={new Map()}
        today="2026-09-24"
        onLookAt={onLookAt}
        onLookAtShow={jest.fn()}
      />,
    );

    expect(drawn.getByText('S1 · E1  Good News About Hell')).toBeTruthy();

    await userEvent.press(
      drawn.getByRole('button', { name: 'Severance, S1 · E1  Good News About Hell' }),
    );

    expect(onLookAt).toHaveBeenCalledWith(anEpisode.id);
  });

  it('draws what is coming up, each opening its programme', async () => {
    const onLookAtShow = jest.fn();
    const drawn = await render(
      <AHomeShelf
        shelf={{ kind: 'comingUp' }}
        upcoming={upcoming}
        progress={new Map()}
        today="2026-09-24"
        onLookAt={jest.fn()}
        onLookAtShow={onLookAtShow}
      />,
    );

    expect(drawn.getByText('Coming up')).toBeTruthy();

    await userEvent.press(drawn.getByRole('button', { name: 'Severance' }));

    expect(onLookAtShow).toHaveBeenCalledWith(LIBRARY, 'severance');
  });

  it('sets a display name so devtools can identify it', () => {
    expect(AHomeShelf.displayName).toBe('AHomeShelf');
  });
});
