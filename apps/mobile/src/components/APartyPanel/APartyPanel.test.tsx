import { fireEvent, render, userEvent } from '@testing-library/react-native';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { aPartyMember } from '@ValenceClient/testing/aPartyMember';
import { aWatchParty } from '@ValenceClient/testing/aWatchParty';
import { aWatchPartyStateWith } from '@ValenceClient/testing/aWatchPartyStateWith';
import { Share } from 'react-native';
import { APartyPanel } from './APartyPanel';

const HOSTING = aWatchParty({
  isHeld: true,
  timekeeperId: 'me',
  members: [
    aPartyMember({ positionSeconds: 100 }),
    aPartyMember({
      connectionId: 'them',
      accountId: 'account-2',
      name: 'Jo',
      role: 'guest',
      positionSeconds: 95,
    }),
  ],
});

beforeEach(() => {
  installPlatform(aFakePlatform({ serverAddress: () => 'https://valence.home' }));
});

describe('APartyPanel', () => {
  it('starts a party around what is playing, where there is none', async () => {
    const watchParty = aWatchPartyStateWith(jest.fn);
    const drawn = await render(
      <APartyPanel
        kind="watch"
        watchParty={watchParty}
        mediaId="a-film"
        people={[]}
        onClose={jest.fn()}
      />,
    );

    await userEvent.press(drawn.getByLabelText('Start a watch party'));

    expect(watchParty.open).toHaveBeenCalledWith('a-film', 'watch');
  });

  it('says who is in it, who is behind, and who the room waits for', async () => {
    const drawn = await render(
      <APartyPanel
        kind="watch"
        watchParty={aWatchPartyStateWith(jest.fn, { party: HOSTING, waitingFor: ['Jo'] })}
        mediaId="film-1"
        people={[]}
        onClose={jest.fn()}
      />,
    );

    expect(drawn.getByText('Sam (you)')).toBeTruthy();
    expect(drawn.getByText('Guest · Watching · 5.0s behind')).toBeTruthy();
    expect(drawn.getByText('Waiting for Jo to catch up')).toBeTruthy();
  });

  it('lets whoever runs it make somebody a co-host, or put them out', async () => {
    const watchParty = aWatchPartyStateWith(jest.fn, { party: HOSTING });
    const drawn = await render(
      <APartyPanel
        kind="watch"
        watchParty={watchParty}
        mediaId="film-1"
        people={[]}
        onClose={jest.fn()}
      />,
    );

    await userEvent.press(drawn.getByText('Make a co-host'));
    await userEvent.press(drawn.getByLabelText('Remove Jo from the party'));

    expect(watchParty.setRole).toHaveBeenCalledWith('them', 'coHost');
    expect(watchParty.remove).toHaveBeenCalledWith('them');
  });

  it('shares an invitation to this server, and asks the household along', async () => {
    const share = jest
      .spyOn(Share, 'share')
      .mockResolvedValue({ action: 'sharedAction', activityType: undefined });
    const watchParty = aWatchPartyStateWith(jest.fn, { party: HOSTING });
    const drawn = await render(
      <APartyPanel
        kind="watch"
        watchParty={watchParty}
        mediaId="film-1"
        people={[
          { id: 'kim', name: 'Kim' },
          { id: 'jo', name: 'Jo', accountId: 'account-2' },
        ]}
        onClose={jest.fn()}
      />,
    );

    await userEvent.press(drawn.getByLabelText('Share the invitation'));
    await userEvent.press(drawn.getByLabelText('Ask Kim along'));

    expect(share).toHaveBeenCalledWith(
      expect.objectContaining({ url: 'https://valence.home/watch/film-1?party=p-1' }),
    );
    expect(watchParty.ask).toHaveBeenCalledWith('kim');
    expect(drawn.queryByLabelText('Ask Jo along')).toBeNull();
  });

  it('asks for the password a party wants before it can be joined', async () => {
    const watchParty = aWatchPartyStateWith(jest.fn, {
      passwordWanted: { partyId: 'p-9', wasWrong: false },
    });
    const drawn = await render(
      <APartyPanel
        kind="watch"
        watchParty={watchParty}
        mediaId="film-1"
        people={[]}
        onClose={jest.fn()}
      />,
    );

    await userEvent.type(drawn.getByLabelText('Watch party password'), 'popcorn');
    await userEvent.press(drawn.getByLabelText('Join'));

    expect(watchParty.join).toHaveBeenCalledWith('p-9', 'popcorn');
  });

  it('leaves, and closes', async () => {
    const onClose = jest.fn();
    const watchParty = aWatchPartyStateWith(jest.fn, { party: HOSTING });
    const drawn = await render(
      <APartyPanel
        kind="watch"
        watchParty={watchParty}
        mediaId="film-1"
        people={[]}
        onClose={onClose}
      />,
    );

    await userEvent.press(drawn.getByLabelText('Leave'));

    expect(watchParty.leave).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it('starts a listening party around the song playing, once there is one', async () => {
    const watchParty = aWatchPartyStateWith(jest.fn);
    const silent = await render(
      <APartyPanel
        kind="listen"
        watchParty={watchParty}
        mediaId={null}
        people={[]}
        onClose={jest.fn()}
      />,
    );

    expect(
      silent.getByText(
        'Play something, then start a party and send the link to anybody with an account here.',
      ),
    ).toBeTruthy();

    const playing = await render(
      <APartyPanel
        kind="listen"
        watchParty={watchParty}
        mediaId="song-1"
        people={[]}
        onClose={jest.fn()}
      />,
    );

    await userEvent.press(playing.getByLabelText('Start a listening party'));

    expect(watchParty.open).toHaveBeenCalledWith('song-1', 'listen');
  });

  it('shares an invitation into the music, and says who is listening', async () => {
    const share = jest
      .spyOn(Share, 'share')
      .mockResolvedValue({ action: 'sharedAction', activityType: undefined });
    const drawn = await render(
      <APartyPanel
        kind="listen"
        watchParty={aWatchPartyStateWith(jest.fn, {
          party: aWatchParty({ kind: 'listen', members: [aPartyMember()] }),
        })}
        mediaId="song-1"
        people={[]}
        onClose={jest.fn()}
      />,
    );

    expect(drawn.getByText('1 listening')).toBeTruthy();

    await userEvent.press(drawn.getByLabelText('Share the invitation'));

    expect(share).toHaveBeenCalledWith(
      expect.objectContaining({ url: 'https://valence.home/music?party=p-1' }),
    );
  });

  it('offers no listening party to somebody already watching one', async () => {
    const drawn = await render(
      <APartyPanel
        kind="listen"
        watchParty={aWatchPartyStateWith(jest.fn, { party: aWatchParty() })}
        mediaId="song-1"
        people={[]}
        onClose={jest.fn()}
      />,
    );

    expect(drawn.getByText('You are in a watch party')).toBeTruthy();
    expect(drawn.queryByLabelText('Start a listening party')).toBeNull();
  });

  it('does not try a password that was never typed', async () => {
    const watchParty = aWatchPartyStateWith(jest.fn, {
      passwordWanted: { partyId: 'p-9', wasWrong: false },
    });
    const drawn = await render(
      <APartyPanel
        kind="watch"
        watchParty={watchParty}
        mediaId="film-1"
        people={[]}
        onClose={jest.fn()}
      />,
    );

    await fireEvent(drawn.getByLabelText('Watch party password'), 'submitEditing');

    expect(watchParty.join).not.toHaveBeenCalled();
  });
});
