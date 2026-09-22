import { render, userEvent } from '@testing-library/react-native';
import { MediaSummarySchema } from '@ValenceContracts/schemas/Library';
import { AnEpisode } from './AnEpisode';

const THE_PILOT = MediaSummarySchema.parse({
  id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
  libraryId: '3fa85f64-5717-4562-b3fc-2c963f66afa7',
  title: 'Pilot',
  year: null,
  durationSeconds: 2640,
  width: 1920,
  height: 1080,
  videoCodec: 'hevc',
  videoRange: 'SDR',
  addedAt: '2026-01-01T00:00:00.000Z',
  episodeNumber: 1,
});

describe('AnEpisode', () => {
  it('says which episode it is first, since that is what people look for', async () => {
    const drawn = await render(
      <AnEpisode
        episode={THE_PILOT}
        watched={0}
        onWatch={jest.fn()}
        airs=""
        onLookAt={jest.fn()}
      />,
    );

    expect(drawn.getByText('1')).toBeTruthy();
  });

  it('says what it is called and how long it runs', async () => {
    const drawn = await render(
      <AnEpisode
        episode={THE_PILOT}
        watched={0}
        onWatch={jest.fn()}
        airs=""
        onLookAt={jest.fn()}
      />,
    );

    expect(drawn.getByText('Pilot')).toBeTruthy();
    expect(drawn.getByText('44m')).toBeTruthy();
  });

  it('plays it in one press, since they have already chosen', async () => {
    const onWatch = jest.fn();
    const drawn = await render(
      <AnEpisode episode={THE_PILOT} watched={0} onWatch={onWatch} airs="" onLookAt={jest.fn()} />,
    );

    await userEvent.press(drawn.getByLabelText('Pilot'));

    expect(onWatch).toHaveBeenCalled();
  });

  it('manages an episode nobody numbered', async () => {
    const drawn = await render(
      <AnEpisode
        episode={{ ...THE_PILOT, episodeNumber: null }}
        watched={0}
        onWatch={jest.fn()}
        airs=""
        onLookAt={jest.fn()}
      />,
    );

    expect(drawn.getByText('Pilot')).toBeTruthy();
  });
});
