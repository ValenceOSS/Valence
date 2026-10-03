import { act, render } from '@testing-library/react-native';
import { aWatchParty } from '@ValenceClient/testing/aWatchParty';
import { aWatchPartyStateWith } from '@ValenceClient/testing/aWatchPartyStateWith';
import { WAIT_FOR_THE_ROOM_MS } from '@ValenceClient/party/whereToBegin';
import { Player } from '@ValenceTv/screens/Player/Player';
import { PlayingTogether } from './PlayingTogether';

jest.mock('@ValenceTv/screens/Player/Player', () => ({ Player: jest.fn(() => null) }));

jest.mock('@ValenceTv/navigation/useMenuButton', () => ({ useMenuButton: () => undefined }));

/**
 * What the player was last drawn with.
 *
 * @returns Its props.
 */
const playerAsDrawn = () => jest.mocked(Player).mock.calls.at(-1)?.[0];

beforeEach(() => {
  jest.mocked(Player).mockClear();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('PlayingTogether', () => {
  it('begins where this account left off, outside a party', async () => {
    await render(
      <PlayingTogether
        watchParty={aWatchPartyStateWith(jest.fn)}
        invitedTo={null}
        mediaId="a-film"
        startSeconds={30}
        carriedOn={0}
        onLeave={jest.fn()}
        onNext={jest.fn()}
      />,
    );

    expect(playerAsDrawn()?.startSeconds).toBe(30);
  });

  it('joins the party it was invited to and begins where the room is', async () => {
    const watchParty = aWatchPartyStateWith(jest.fn);
    const drawn = await render(
      <PlayingTogether
        watchParty={watchParty}
        invitedTo="p-1"
        mediaId="film-1"
        startSeconds={30}
        carriedOn={0}
        onLeave={jest.fn()}
        onNext={jest.fn()}
      />,
    );

    expect(drawn.getByText('Joining the watch party')).toBeTruthy();
    expect(watchParty.join).toHaveBeenCalledWith('p-1');

    await drawn.rerender(
      <PlayingTogether
        watchParty={{ ...watchParty, party: aWatchParty(), referenceSeconds: 600 }}
        invitedTo="p-1"
        mediaId="film-1"
        startSeconds={30}
        carriedOn={0}
        onLeave={jest.fn()}
        onNext={jest.fn()}
      />,
    );

    expect(playerAsDrawn()?.startSeconds).toBe(600);
  });

  it('stops waiting for a room that never answers', async () => {
    jest.useFakeTimers();

    await render(
      <PlayingTogether
        watchParty={aWatchPartyStateWith(jest.fn)}
        invitedTo="p-1"
        mediaId="film-1"
        startSeconds={30}
        carriedOn={0}
        onLeave={jest.fn()}
        onNext={jest.fn()}
      />,
    );

    await act(() => {
      jest.advanceTimersByTime(WAIT_FOR_THE_ROOM_MS);
    });

    expect(playerAsDrawn()?.startSeconds).toBe(30);
  });

  it('leaves the party on leaving the film', async () => {
    const onLeave = jest.fn();
    const watchParty = aWatchPartyStateWith(jest.fn, { party: aWatchParty() });

    await render(
      <PlayingTogether
        watchParty={watchParty}
        invitedTo={null}
        mediaId="film-1"
        startSeconds={0}
        carriedOn={0}
        onLeave={onLeave}
        onNext={jest.fn()}
      />,
    );

    await act(() => {
      playerAsDrawn()?.onLeave();
    });

    expect(watchParty.leave).toHaveBeenCalled();
    expect(onLeave).toHaveBeenCalled();
  });

  it('leaves a party watching something else, such as the episode before', async () => {
    const watchParty = aWatchPartyStateWith(jest.fn, {
      party: aWatchParty({ mediaId: 'episode-1' }),
    });

    await render(
      <PlayingTogether
        watchParty={watchParty}
        invitedTo={null}
        mediaId="episode-2"
        startSeconds={0}
        carriedOn={0}
        onLeave={jest.fn()}
        onNext={jest.fn()}
      />,
    );

    expect(watchParty.leave).toHaveBeenCalled();
  });

  it('leaves a party it was still joining when they leave', async () => {
    jest.useFakeTimers();
    const watchParty = aWatchPartyStateWith(jest.fn);

    await render(
      <PlayingTogether
        watchParty={watchParty}
        invitedTo="p-1"
        mediaId="film-1"
        startSeconds={0}
        carriedOn={0}
        onLeave={jest.fn()}
        onNext={jest.fn()}
      />,
    );

    await act(() => {
      jest.advanceTimersByTime(WAIT_FOR_THE_ROOM_MS);
    });

    await act(() => {
      playerAsDrawn()?.onLeave();
    });

    expect(watchParty.leave).toHaveBeenCalled();
  });
});
