import { act, render } from '@testing-library/react-native';
import { aWatchParty } from '@ValenceClient/testing/aWatchParty';
import { aWatchPartyStateWith } from '@ValenceClient/testing/aWatchPartyStateWith';
import { WAIT_FOR_THE_ROOM_MS } from '@ValenceClient/party/whereToBegin';
import { Watching } from '@ValenceMobile/components/Watching/Watching';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import { WatchingTogether } from './WatchingTogether';

jest.mock('@ValenceMobile/components/Watching/Watching', () => ({
  Watching: jest.fn(() => null),
}));

/**
 * What the player was last drawn with.
 *
 * @returns Its props.
 */
const playerAsDrawn = () => jest.mocked(Watching).mock.calls.at(-1)?.[0];

beforeEach(() => {
  jest.mocked(Watching).mockClear();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('WatchingTogether', () => {
  it('begins where this account left off, outside a party', async () => {
    await render(
      <WatchingTogether
        watchParty={aWatchPartyStateWith(jest.fn)}
        invitedTo={null}
        mediaId="a-film"
        startSeconds={30}
        onDone={jest.fn()}
      />,
      { wrapper: CacheScope },
    );

    expect(playerAsDrawn()?.startSeconds).toBe(30);
  });

  it('joins the party it was invited to and begins where the room is', async () => {
    const watchParty = aWatchPartyStateWith(jest.fn);
    const drawn = await render(
      <WatchingTogether
        watchParty={watchParty}
        invitedTo="p-1"
        mediaId="film-1"
        startSeconds={30}
        onDone={jest.fn()}
      />,
      { wrapper: CacheScope },
    );

    expect(drawn.getByText('Joining the watch party')).toBeTruthy();
    expect(watchParty.join).toHaveBeenCalledWith('p-1');

    await drawn.rerender(
      <WatchingTogether
        watchParty={{ ...watchParty, party: aWatchParty(), referenceSeconds: 600 }}
        invitedTo="p-1"
        mediaId="film-1"
        startSeconds={30}
        onDone={jest.fn()}
      />,
    );

    expect(playerAsDrawn()?.startSeconds).toBe(600);
  });

  it('stops waiting for a room that never answers', async () => {
    jest.useFakeTimers();

    await render(
      <WatchingTogether
        watchParty={aWatchPartyStateWith(jest.fn)}
        invitedTo="p-1"
        mediaId="film-1"
        startSeconds={30}
        onDone={jest.fn()}
      />,
      { wrapper: CacheScope },
    );

    await act(() => {
      jest.advanceTimersByTime(WAIT_FOR_THE_ROOM_MS);
    });

    expect(playerAsDrawn()?.startSeconds).toBe(30);
  });

  it('leaves the party on stopping watching', async () => {
    const onDone = jest.fn();
    const watchParty = aWatchPartyStateWith(jest.fn, { party: aWatchParty() });
    await render(
      <WatchingTogether
        watchParty={watchParty}
        invitedTo={null}
        mediaId="film-1"
        onDone={onDone}
      />,
      { wrapper: CacheScope },
    );

    await act(() => {
      playerAsDrawn()?.onDone();
    });

    expect(watchParty.leave).toHaveBeenCalled();
    expect(onDone).toHaveBeenCalled();
  });

  it('leaves a party it was still joining when they stop', async () => {
    jest.useFakeTimers();
    const watchParty = aWatchPartyStateWith(jest.fn);

    await render(
      <WatchingTogether
        watchParty={watchParty}
        invitedTo="p-1"
        mediaId="film-1"
        onDone={jest.fn()}
      />,
      { wrapper: CacheScope },
    );

    await act(() => {
      jest.advanceTimersByTime(WAIT_FOR_THE_ROOM_MS);
    });

    await act(() => {
      playerAsDrawn()?.onDone();
    });

    expect(watchParty.leave).toHaveBeenCalled();
  });

  it('leaves a party watching something else, such as the episode before', async () => {
    const watchParty = aWatchPartyStateWith(jest.fn, {
      party: aWatchParty({ mediaId: 'episode-1' }),
    });

    await render(
      <WatchingTogether
        watchParty={watchParty}
        invitedTo={null}
        mediaId="episode-2"
        onDone={jest.fn()}
      />,
      { wrapper: CacheScope },
    );

    expect(watchParty.leave).toHaveBeenCalled();
  });

  it('stays in a party watching this', async () => {
    const watchParty = aWatchPartyStateWith(jest.fn, { party: aWatchParty({ mediaId: 'film-1' }) });

    await render(
      <WatchingTogether
        watchParty={watchParty}
        invitedTo={null}
        mediaId="film-1"
        onDone={jest.fn()}
      />,
      { wrapper: CacheScope },
    );

    expect(watchParty.leave).not.toHaveBeenCalled();
  });
});
