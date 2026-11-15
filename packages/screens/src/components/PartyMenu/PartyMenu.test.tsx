import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { PartyMenu } from './PartyMenu';
import type { PartyMember, WatchParty } from '@ValenceContracts/schemas/WatchParty';

const member = (over?: Partial<PartyMember>): PartyMember => ({
  connectionId: 'dan',
  accountId: 'account-dan',
  profileId: null,
  name: 'Dan',
  role: 'host',
  joinedAtMs: 1000,
  isWatching: true,
  isReady: true,
  positionSeconds: 100,
  reportedAtMs: 1000,
  bufferedAheadSeconds: 10,
  ...over,
});

const party = (over?: Partial<WatchParty>): WatchParty => ({
  id: 'party-1',
  kind: 'watch',
  mediaId: 'a-film',
  createdAtMs: 1000,
  everyoneMaySeek: true,
  everyoneMayPlayPause: true,
  hasPassword: false,
  isPlaying: true,
  isHeld: false,
  timekeeperId: 'dan',
  chatIsOn: false,
  members: [member(), member({ connectionId: 'sam', name: 'Sam', role: 'guest' })],
  ...over,
});

const openIt = async (actor: ReturnType<typeof userEvent.setup>, name: string | RegExp) => {
  await actor.click(screen.getByRole('button', { name }));
};

describe('PartyMenu', () => {
  it('offers to start a party where there is none', async () => {
    const actor = userEvent.setup();

    render(<PartyMenu party={null} meConnectionId="dan" />);
    await openIt(actor, 'Watch party');

    expect(screen.getByRole('button', { name: 'Start a watch party' })).toBeInTheDocument();
  });

  it('starts one when asked', async () => {
    const actor = userEvent.setup();
    const onOpen = vi.fn();

    render(<PartyMenu party={null} meConnectionId="dan" onOpen={onOpen} />);
    await openIt(actor, 'Watch party');
    await actor.click(screen.getByRole('button', { name: 'Start a watch party' }));

    expect(onOpen).toHaveBeenCalled();
  });

  it('stays open on starting one, to show the party once it is there', async () => {
    const actor = userEvent.setup();
    const { rerender } = render(<PartyMenu party={null} meConnectionId="dan" onOpen={vi.fn()} />);

    await openIt(actor, 'Watch party');
    await actor.click(screen.getByRole('button', { name: 'Start a watch party' }));
    rerender(<PartyMenu party={party()} meConnectionId="dan" startedHere="party-1" />);

    expect(screen.getByText('Dan (you)')).toBeInTheDocument();
  });

  it('opens by itself on a party started here from elsewhere, once', async () => {
    const actor = userEvent.setup();
    const onOpenChange = vi.fn();
    const { rerender } = render(
      <PartyMenu
        party={null}
        meConnectionId="dan"
        startedHere={null}
        onOpenChange={onOpenChange}
      />,
    );

    rerender(
      <PartyMenu
        party={party()}
        meConnectionId="dan"
        startedHere="party-1"
        onOpenChange={onOpenChange}
      />,
    );

    expect(screen.getByText('Dan (you)')).toBeInTheDocument();
    expect(onOpenChange).toHaveBeenCalledWith(true);

    await actor.keyboard('{Escape}');
    rerender(
      <PartyMenu
        party={party({ isPlaying: false })}
        meConnectionId="dan"
        startedHere="party-1"
        onOpenChange={onOpenChange}
      />,
    );

    expect(screen.queryByText('Dan (you)')).not.toBeInTheDocument();
  });

  it('does not open by itself on a party it joined', () => {
    render(<PartyMenu party={party()} meConnectionId="dan" startedHere={null} />);

    expect(screen.queryByText('Dan (you)')).not.toBeInTheDocument();
  });

  it('says how many are in the party without being opened, watching or not', () => {
    const mixed = party({
      members: [member(), member({ connectionId: 'sam', name: 'Sam', isWatching: false })],
    });

    render(<PartyMenu party={mixed} meConnectionId="dan" />);

    expect(screen.getByRole('button', { name: /2 in the party/ })).toBeInTheDocument();
  });

  it('shows who is in the party once opened', async () => {
    const actor = userEvent.setup();

    render(<PartyMenu party={party()} meConnectionId="dan" />);
    await openIt(actor, /Watch party/);

    expect(screen.getByText(/Sam/)).toBeInTheDocument();
  });

  it('gives the host the controls for running it', async () => {
    const actor = userEvent.setup();

    render(<PartyMenu party={party()} meConnectionId="dan" onLoosen={vi.fn()} />);
    await openIt(actor, /Watch party/);

    expect(screen.getByRole('switch', { name: /scrub/ })).toBeInTheDocument();
  });

  it('does not give a guest those controls', async () => {
    const actor = userEvent.setup();

    render(<PartyMenu party={party()} meConnectionId="sam" onLoosen={vi.fn()} />);
    await openIt(actor, /Watch party/);

    expect(screen.queryByRole('switch', { name: /scrub/ })).not.toBeInTheDocument();
  });

  it('offers the invitation to anybody in the party', async () => {
    const actor = userEvent.setup();

    render(<PartyMenu party={party()} meConnectionId="sam" invitation="https://valence.local/x" />);
    await openIt(actor, /Watch party/);

    expect(screen.getByText('https://valence.local/x')).toBeInTheDocument();
  });

  it('goes when the bar it hangs from goes, rather than floating over nothing', async () => {
    const actor = userEvent.setup();

    const { rerender } = render(<PartyMenu party={party()} meConnectionId="dan" />);

    await openIt(actor, /Watch party/);

    expect(screen.getByText(/Sam/)).toBeInTheDocument();

    rerender(<PartyMenu party={party()} meConnectionId="dan" isHidden />);

    expect(screen.queryByText(/Sam/)).not.toBeInTheDocument();
  });

  it('tells the player it is open, so the bar waits rather than sliding away underneath', async () => {
    const actor = userEvent.setup();
    const onOpenChange = vi.fn();

    render(<PartyMenu party={party()} meConnectionId="dan" onOpenChange={onOpenChange} />);
    await openIt(actor, /Watch party/);

    expect(onOpenChange).toHaveBeenCalledWith(true);
  });

  it('lets the host put somebody out from here', async () => {
    const actor = userEvent.setup();
    const onRemove = vi.fn();

    render(<PartyMenu party={party()} meConnectionId="dan" onRemove={onRemove} />);
    await openIt(actor, /Watch party/);
    await actor.click(screen.getByRole('button', { name: 'Actions for Sam' }));
    await actor.click(screen.getByRole('menuitem', { name: /Remove Sam from the party/ }));

    expect(onRemove).toHaveBeenCalledWith('sam');
  });

  it('sets a display name so devtools can identify it', () => {
    expect(PartyMenu.displayName).toBe('PartyMenu');
  });
});
