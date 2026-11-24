import { render, userEvent } from '@testing-library/react-native';
import { HistoryCard } from './HistoryCard';
import type { WatchedTitle } from '@ValenceClient/history/groupHistory';
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

const titleOf = (latest: Viewing): WatchedTitle => ({
  key: latest.mediaItemId,
  latest,
  viewingIds: [latest.id],
});

describe('HistoryCard', () => {
  it('names the programme, then the episode, when it was watched and that it was finished', async () => {
    const drawn = await render(
      <HistoryCard watched={titleOf(anEpisode)} onPress={jest.fn()} onFocus={jest.fn()} />,
    );

    expect(drawn.getByText('Severance')).toBeTruthy();
    expect(drawn.getByText(/^Half Loop · .+ · Finished$/u)).toBeTruthy();
  });

  it('names a film by itself', async () => {
    const drawn = await render(
      <HistoryCard
        watched={titleOf({ ...anEpisode, title: 'Arrival', seriesTitle: null, isFinished: false })}
        onPress={jest.fn()}
        onFocus={jest.fn()}
      />,
    );

    expect(drawn.getByText('Arrival')).toBeTruthy();
  });

  it('says how far through it somebody got where they stopped part way, and only then', async () => {
    const drawn = await render(
      <HistoryCard
        watched={titleOf(anEpisode)}
        watchedFraction={0.4}
        onPress={jest.fn()}
        onFocus={jest.fn()}
      />,
    );

    expect(drawn.getByRole('progressbar').props.accessibilityValue).toMatchObject({ now: 40 });

    const plain = await render(
      <HistoryCard watched={titleOf(anEpisode)} onPress={jest.fn()} onFocus={jest.fn()} />,
    );

    expect(plain.queryByRole('progressbar')).toBeNull();
  });

  it('draws as wide as it is asked to', async () => {
    const drawn = await render(
      <HistoryCard
        watched={titleOf(anEpisode)}
        width={320}
        onPress={jest.fn()}
        onFocus={jest.fn()}
      />,
    );

    expect(JSON.stringify(drawn.toJSON())).toContain('"width":320');
    expect(JSON.stringify(drawn.toJSON())).toContain('"height":180');
  });

  it('says when it is chosen', async () => {
    const onPress = jest.fn();
    const watched = titleOf(anEpisode);
    const drawn = await render(
      <HistoryCard watched={watched} onPress={onPress} onFocus={jest.fn()} />,
    );

    await userEvent.press(drawn.getByText('Severance'));

    expect(onPress).toHaveBeenCalledWith(watched);
  });

  it('sets a display name so devtools can identify it', () => {
    expect(HistoryCard.displayName).toBe('HistoryCard');
  });
});
