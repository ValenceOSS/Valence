import { fireEvent, render, userEvent } from '@testing-library/react-native';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { aPartyMember } from '@ValenceClient/testing/aPartyMember';
import { aWatchParty } from '@ValenceClient/testing/aWatchParty';
import { aWatchPartyStateWith } from '@ValenceClient/testing/aWatchPartyStateWith';
import { PartyMenu } from './PartyMenu';

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

describe('PartyMenu', () => {
  it('starts a party around what is playing, where there is none', async () => {
    const watchParty = aWatchPartyStateWith(jest.fn);
    const drawn = await render(
      <PartyMenu watchParty={watchParty} mediaId="a-film" people={[]} onLeave={jest.fn()} />,
    );

    await userEvent.press(drawn.getByRole('button', { name: 'Start a watch party' }));

    expect(watchParty.open).toHaveBeenCalledWith('a-film');
  });

  it('says who is in it, who is behind, and who the room waits for', async () => {
    const drawn = await render(
      <PartyMenu
        watchParty={aWatchPartyStateWith(jest.fn, { party: HOSTING, waitingFor: ['Jo'] })}
        mediaId="film-1"
        people={[]}
        onLeave={jest.fn()}
      />,
    );

    expect(drawn.getByText('Sam (you)')).toBeTruthy();
    expect(drawn.getByText('Guest · Watching · 5.0s behind')).toBeTruthy();
    expect(drawn.getByText('Waiting for Jo to catch up')).toBeTruthy();
  });

  it('lets whoever runs it make somebody a co-host, put them out, or loosen it', async () => {
    const watchParty = aWatchPartyStateWith(jest.fn, { party: HOSTING });
    const drawn = await render(
      <PartyMenu watchParty={watchParty} mediaId="film-1" people={[]} onLeave={jest.fn()} />,
    );

    await userEvent.press(drawn.getByRole('button', { name: /^Make a co-host/u }));
    await userEvent.press(drawn.getByRole('button', { name: /^Remove Jo from the party/u }));
    await userEvent.press(drawn.getByRole('button', { name: /^Everyone can skip around/u }));

    expect(watchParty.setRole).toHaveBeenCalledWith('them', 'coHost');
    expect(watchParty.remove).toHaveBeenCalledWith('them');
    expect(watchParty.loosen).toHaveBeenCalledWith({ everyoneMaySeek: false });
  });

  it('asks the household along, leaving out whoever is already there', async () => {
    const watchParty = aWatchPartyStateWith(jest.fn, { party: HOSTING });
    const drawn = await render(
      <PartyMenu
        watchParty={watchParty}
        mediaId="film-1"
        people={[
          { id: 'kim', name: 'Kim' },
          { id: 'jo', name: 'Jo', accountId: 'account-2' },
        ]}
        onLeave={jest.fn()}
      />,
    );

    await userEvent.press(drawn.getByRole('button', { name: /^Ask Kim along/u }));

    expect(watchParty.ask).toHaveBeenCalledWith('kim');
    expect(drawn.queryByRole('button', { name: /^Ask Jo along/u })).toBeNull();
  });

  it('asks for the password a party wants before it can be joined', async () => {
    const watchParty = aWatchPartyStateWith(jest.fn, {
      passwordWanted: { partyId: 'p-9', wasWrong: true },
    });
    const drawn = await render(
      <PartyMenu watchParty={watchParty} mediaId="film-1" people={[]} onLeave={jest.fn()} />,
    );

    expect(drawn.getByText('That is not the password for this party.')).toBeTruthy();

    const typing = drawn.getAllByLabelText('Watch party password').at(-1);

    if (typing === undefined) {
      throw new Error('The password field was not drawn.');
    }

    await fireEvent.changeText(typing, 'popcorn');
    await userEvent.press(drawn.getByRole('button', { name: /^Join/u }));

    expect(watchParty.join).toHaveBeenCalledWith('p-9', 'popcorn');
  });

  it('leaves the party', async () => {
    const onLeave = jest.fn();
    const watchParty = aWatchPartyStateWith(jest.fn, { party: HOSTING });
    const drawn = await render(
      <PartyMenu watchParty={watchParty} mediaId="film-1" people={[]} onLeave={onLeave} />,
    );

    await userEvent.press(drawn.getByRole('button', { name: /^Leave/u }));

    expect(watchParty.leave).toHaveBeenCalled();
    expect(onLeave).toHaveBeenCalled();
  });
});
