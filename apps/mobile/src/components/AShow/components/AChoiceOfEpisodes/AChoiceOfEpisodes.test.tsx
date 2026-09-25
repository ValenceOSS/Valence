import { render, userEvent } from '@testing-library/react-native';
import { MediaSummarySchema } from '@ValenceContracts/schemas/Library';
import { AChoiceOfEpisodes } from './AChoiceOfEpisodes';

const anEpisode = (n: number) =>
  MediaSummarySchema.parse({
    id: `3fa85f64-5717-4562-b3fc-2c963f66af0${n.toString()}`,
    libraryId: '3fa85f64-5717-4562-b3fc-2c963f66afa7',
    title: `Episode ${n.toString()}`,
    year: null,
    durationSeconds: 2640,
    width: 1920,
    height: 1080,
    videoCodec: 'hevc',
    videoRange: 'SDR',
    addedAt: '2026-01-01T00:00:00.000Z',
    seasonNumber: 1,
    episodeNumber: n,
  });

describe('AChoiceOfEpisodes', () => {
  it('downloads just the episodes picked', async () => {
    const onChosen = jest.fn();
    const drawn = await render(
      <AChoiceOfEpisodes
        isOpen
        seasons={[{ seasonNumber: 1, episodes: [anEpisode(1), anEpisode(2)] }]}
        held={new Set()}
        onClose={jest.fn()}
        onChosen={onChosen}
      />,
    );

    await userEvent.press(drawn.getByRole('button', { name: 'Episode 2' }));
    await userEvent.press(drawn.getByText('Download 1 episode'));

    expect(onChosen).toHaveBeenCalledWith([anEpisode(2).id]);
  });

  it('picks a whole season at once', async () => {
    const drawn = await render(
      <AChoiceOfEpisodes
        isOpen
        seasons={[{ seasonNumber: 1, episodes: [anEpisode(1), anEpisode(2)] }]}
        held={new Set()}
        onClose={jest.fn()}
        onChosen={jest.fn()}
      />,
    );

    await userEvent.press(drawn.getByRole('button', { name: 'Pick Season 1' }));

    expect(drawn.getByText('Download 2 episodes')).toBeTruthy();
  });
});
