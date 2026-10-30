import { render, userEvent } from '@testing-library/react-native';
import { HistoryCard } from './HistoryCard';
import type { Viewing } from '@ValenceContracts/schemas/Viewing';

const anEpisode: Viewing = {
  id: 'v1',
  mediaItemId: 'episode-1',
  title: 'Half Loop',
  seriesTitle: 'Severance',
  seriesId: 'series-1',
  startedAt: new Date().toISOString(),
  lastWatchedAt: new Date().toISOString(),
  secondsWatched: 600,
  isFinished: true,
};

describe('HistoryCard', () => {
  it('names the programme, then the episode, when it was watched and that it was finished', async () => {
    const drawn = await render(
      <HistoryCard viewing={anEpisode} onPress={jest.fn()} onFocus={jest.fn()} />,
    );

    expect(drawn.getByText('Severance')).toBeTruthy();
    expect(drawn.getByText(/^Half Loop · .+ · Finished$/u)).toBeTruthy();
  });

  it('names a film by itself', async () => {
    const drawn = await render(
      <HistoryCard
        viewing={{ ...anEpisode, title: 'Arrival', seriesTitle: null, isFinished: false }}
        onPress={jest.fn()}
        onFocus={jest.fn()}
      />,
    );

    expect(drawn.getByText('Arrival')).toBeTruthy();
  });

  it('says when it is chosen', async () => {
    const onPress = jest.fn();
    const drawn = await render(
      <HistoryCard viewing={anEpisode} onPress={onPress} onFocus={jest.fn()} />,
    );

    await userEvent.press(drawn.getByText('Severance'));

    expect(onPress).toHaveBeenCalledWith(anEpisode);
  });
});
