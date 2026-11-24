import { act, render, userEvent } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Alert } from 'react-native';
import { aMediaSummary } from '@ValenceClient/testing/aMediaSummary';
import { aViewing } from '@ValenceClient/testing/aViewing';
import { HistoryChoices } from './HistoryChoices';
import type { WatchedTitle } from '@ValenceClient/history/groupHistory';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';
import type { Viewing } from '@ValenceContracts/schemas/Viewing';
import type { WatchProgress } from '@ValenceContracts/schemas/WatchProgress';
import type { HistoryChoicesProps } from './HistoryChoices.types';

const mockMenu: { back: (() => void) | null } = { back: null };

const mockFind = jest.fn<Promise<MediaSummary | null>, [QueryClient, Viewing]>();

jest.mock('@ValenceTv/navigation/useMenuToClose', () => ({
  useMenuToClose: (back: () => void) => {
    mockMenu.back = back;
  },
}));

jest.mock('@ValenceClient/library/findTheEpisodeAfter', () => ({
  findTheEpisodeAfter: (cache: QueryClient, watched: Viewing) => mockFind(cache, watched),
}));

const EPISODE = '00000000-0000-4000-8000-0000000000e1';

const anEpisode = aViewing({
  id: 'v2',
  mediaItemId: EPISODE,
  title: 'Half Loop',
  seriesTitle: 'Severance',
  seriesId: 'series-1',
  isFinished: true,
});

const titleOf = (latest: Viewing): WatchedTitle => ({
  key: latest.mediaItemId,
  latest,
  viewingIds: [latest.id, 'v1'],
});

const at = (mediaId: string, positionSeconds: number, isFinished = false): WatchProgress => ({
  mediaId,
  positionSeconds,
  durationSeconds: 3000,
  isFinished,
  updatedAt: '2026-09-01T00:00:00.000Z',
});

const drawWith = async (change: Partial<HistoryChoicesProps>) => {
  const props: HistoryChoicesProps = {
    watched: titleOf(anEpisode),
    progress: new Map(),
    onPlay: jest.fn(),
    onOpen: jest.fn(),
    onForget: jest.fn(),
    onClose: jest.fn(),
    ...change,
  };
  const drawn = await render(
    <QueryClientProvider client={new QueryClient()}>
      <HistoryChoices {...props} />
    </QueryClientProvider>,
  );

  return { drawn, props };
};

beforeEach(() => {
  mockFind.mockReset();
  mockMenu.back = null;
});

describe('HistoryChoices', () => {
  it('resumes from where it was left, or plays it from the beginning', async () => {
    const watched = titleOf({ ...anEpisode, isFinished: false });
    const { drawn, props } = await drawWith({
      watched,
      progress: new Map([[EPISODE, at(EPISODE, 754)]]),
    });

    expect(drawn.queryByRole('button', { name: /^Play the next episode/u })).toBeNull();
    expect(mockFind).not.toHaveBeenCalled();

    await userEvent.press(drawn.getByRole('button', { name: /^Resume from / }));

    expect(props.onPlay).toHaveBeenCalledWith(EPISODE, 754);
    expect(props.onClose).toHaveBeenCalled();

    await userEvent.press(drawn.getByRole('button', { name: 'Play from the beginning' }));

    expect(props.onPlay).toHaveBeenLastCalledWith(EPISODE, 0);
  });

  it('plays the next episode where the one watched last was finished', async () => {
    mockFind.mockResolvedValue(
      aMediaSummary({
        id: 'next-one',
        seriesTitle: 'Severance',
        seasonNumber: 1,
        episodeNumber: 3,
      }),
    );

    const { drawn, props } = await drawWith({
      progress: new Map([[EPISODE, at(EPISODE, 3000, true)]]),
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(drawn.queryByRole('button', { name: /^Resume from / })).toBeNull();

    await userEvent.press(drawn.getByRole('button', { name: 'Play the next episode, S1: E3' }));

    expect(props.onPlay).toHaveBeenCalledWith('next-one', 0);
  });

  it('waits for the next episode before drawing any choice, so none moves under the remote', async () => {
    mockFind.mockReturnValue(new Promise(() => undefined));

    const { drawn } = await drawWith({});

    expect(drawn.queryByRole('button', { name: 'Go to the show' })).toBeNull();
  });

  it('offers no next episode after the last one', async () => {
    mockFind.mockResolvedValue(null);

    const { drawn } = await drawWith({});

    await act(async () => {
      await Promise.resolve();
    });

    expect(drawn.getByRole('button', { name: 'Go to the show' })).toBeTruthy();
    expect(drawn.queryByRole('button', { name: /^Play the next episode/u })).toBeNull();
  });

  it('goes to the programme’s page for an episode, and the film’s for a film', async () => {
    mockFind.mockResolvedValue(null);

    const { drawn, props } = await drawWith({});

    await act(async () => {
      await Promise.resolve();
    });
    await userEvent.press(drawn.getByRole('button', { name: 'Go to the show' }));

    expect(props.onOpen).toHaveBeenCalledWith({
      kind: 'show',
      mediaId: EPISODE,
      seriesId: 'series-1',
    });

    const film = await drawWith({ watched: titleOf(aViewing()) });

    await userEvent.press(film.drawn.getByRole('button', { name: 'Go to the film' }));

    expect(film.props.onOpen).toHaveBeenCalledWith({
      kind: 'film',
      mediaId: aViewing().mediaItemId,
      seriesId: null,
    });
  });

  it('asks before taking it off the history, and takes it off when told to', async () => {
    const asked = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    const watched = titleOf(aViewing());
    const { drawn, props } = await drawWith({ watched });

    await userEvent.press(drawn.getByRole('button', { name: 'Remove from history' }));

    expect(props.onForget).not.toHaveBeenCalled();
    expect(asked).toHaveBeenCalledWith('Remove Arrival?', expect.any(String), expect.any(Array));

    const remove = asked.mock.calls[0]?.[2]?.find((button) => button.style === 'destructive');

    remove?.onPress?.();

    expect(props.onForget).toHaveBeenCalledWith(watched);

    asked.mockRestore();
  });

  it('closes on Menu', async () => {
    const { props } = await drawWith({ watched: titleOf(aViewing()) });

    mockMenu.back?.();

    expect(props.onClose).toHaveBeenCalled();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(HistoryChoices.displayName).toBe('HistoryChoices');
  });
});
