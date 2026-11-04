import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import { groupFingerprint } from '@ValenceClient/linking/groupFingerprint';
import { LinkedServerList } from './LinkedServerList';
import type { Refusal } from '@ValenceClient/admin/readRefusal';
import type { Sent } from '@ValenceClient/requests/sendToRequests';
import type { LinkedServer } from '@ValenceContracts/schemas/LinkedServer';

type Answer = 'approve' | 'refuse' | 'check';

type MadeInvite = { id: string; createdAt: string; expiresAt: string; invite: string };

const answerLinkedServer =
  vi.fn<(id: string, what: Answer) => Promise<Sent<LinkedServer | null>>>();

const unlinkServer = vi.fn<(id: string) => Promise<Refusal>>();

const makeLinkInvite = vi.fn<() => Promise<Sent<MadeInvite | null>>>();

const linkWithInvite = vi.fn<(invite: string) => Promise<Sent<LinkedServer | null>>>();

const withdrawLinkInvite = vi.fn<(id: string) => Promise<Refusal>>();

vi.mock('@ValenceClient/admin/answerLinkedServer', () => ({
  answerLinkedServer: (id: string, what: Answer) => answerLinkedServer(id, what),
}));

vi.mock('@ValenceClient/admin/unlinkServer', () => ({
  unlinkServer: (id: string) => unlinkServer(id),
}));

vi.mock('@ValenceClient/admin/makeLinkInvite', () => ({
  makeLinkInvite: () => makeLinkInvite(),
}));

vi.mock('@ValenceClient/admin/linkWithInvite', () => ({
  linkWithInvite: (invite: string) => linkWithInvite(invite),
}));

vi.mock('@ValenceClient/admin/withdrawLinkInvite', () => ({
  withdrawLinkInvite: (id: string) => withdrawLinkInvite(id),
}));

const aServer = (change: Partial<LinkedServer> = {}): LinkedServer => ({
  id: '00000000-0000-4000-8000-000000000001',
  name: 'Elsewhere',
  colour: '#e8503a',
  address: 'https://elsewhere.example',
  fingerprint: 'fedcba9876543210',
  state: 'linked',
  createdAt: '2026-10-02T12:00:00.000Z',
  linkedAt: null,
  lastSeenAt: null,
  pictureAt: null,
  ...change,
});

const INVITE = {
  id: '00000000-0000-4000-8000-0000000000aa',
  createdAt: '2026-11-04T12:00:00.000Z',
  expiresAt: '2026-11-05T12:00:00.000Z',
};

const drawn = (servers: LinkedServer[], onOpen = vi.fn(), invites = [INVITE].slice(0, 0)) =>
  renderInAnAddress(<LinkedServerList servers={servers} invites={invites} onOpen={onOpen} />);

beforeEach(() => {
  answerLinkedServer.mockReset().mockResolvedValue({ value: aServer(), refusal: null });
  unlinkServer.mockReset().mockResolvedValue(null);
  makeLinkInvite
    .mockReset()
    .mockResolvedValue({ value: { ...INVITE, invite: 'valence-link:abc' }, refusal: null });
  linkWithInvite
    .mockReset()
    .mockResolvedValue({ value: aServer({ state: 'awaitingThem' }), refusal: null });
  withdrawLinkInvite.mockReset().mockResolvedValue(null);
});

describe('LinkedServerList', () => {
  it('walks through linking when nothing is linked yet', () => {
    drawn([]);

    expect(screen.getByText('No servers are linked yet')).toBeInTheDocument();
    expect(screen.getByText('Create an invite')).toBeInTheDocument();
    expect(screen.getByText('They use it')).toBeInTheDocument();
    expect(screen.getByText('You approve them')).toBeInTheDocument();
  });

  it('makes an invite and shows it once', async () => {
    drawn([]);

    await userEvent.click(
      within(screen.getByRole('list')).getByRole('button', { name: 'Create invite' }),
    );

    const dialog = await screen.findByRole('dialog', { name: 'Invite a server' });

    expect(within(dialog).getByText('valence-link:abc')).toBeInTheDocument();
  });

  it('links with an invite another server sent', async () => {
    drawn([]);

    await userEvent.click(screen.getByRole('button', { name: 'Use it here' }));

    const dialog = await screen.findByRole('dialog', { name: 'Use an invite' });

    await userEvent.type(within(dialog).getByRole('textbox'), ' valence-link:xyz ');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Link' }));

    await waitFor(() => {
      expect(linkWithInvite).toHaveBeenCalledWith('valence-link:xyz');
    });
  });

  it('shows the fingerprint of a server still to answer, so it can be checked', () => {
    drawn([aServer({ state: 'awaitingUs' })]);

    expect(screen.getByText(groupFingerprint('fedcba9876543210'))).toBeInTheDocument();
  });

  it('shows no fingerprint once a server is linked', () => {
    drawn([aServer()]);

    expect(screen.queryByText(groupFingerprint('fedcba9876543210'))).not.toBeInTheDocument();
  });

  it('approves a server asking to link', async () => {
    drawn([aServer({ state: 'awaitingUs' })]);

    await userEvent.click(screen.getByRole('button', { name: 'Approve' }));

    await waitFor(() => {
      expect(answerLinkedServer).toHaveBeenCalledWith(aServer().id, 'approve');
    });
  });

  it('asks again after a server it is waiting on, or cancels asking', async () => {
    drawn([aServer({ state: 'awaitingThem' })]);

    await userEvent.click(screen.getByRole('button', { name: 'Check again' }));

    await waitFor(() => {
      expect(answerLinkedServer).toHaveBeenCalledWith(aServer().id, 'check');
    });

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    await waitFor(() => {
      expect(unlinkServer).toHaveBeenCalledWith(aServer().id);
    });
  });

  it('offers no cancel to a server asking this one', () => {
    drawn([aServer({ state: 'awaitingUs' })]);

    expect(screen.queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument();
  });

  it('forgets a server that unlinked only once asked', async () => {
    drawn([aServer({ state: 'unlinkedByThem' })]);

    await userEvent.click(screen.getByRole('button', { name: 'Remove' }));

    expect(unlinkServer).not.toHaveBeenCalled();

    await userEvent.click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: 'Remove' }),
    );

    await waitFor(() => {
      expect(unlinkServer).toHaveBeenCalledWith(aServer().id);
    });
  });

  it('opens a linked server onto its page, and not one still waiting', async () => {
    const onOpen = vi.fn();

    drawn(
      [
        aServer(),
        aServer({
          id: '00000000-0000-4000-8000-000000000002',
          name: 'Waiting',
          state: 'awaitingThem',
        }),
      ],
      onOpen,
    );

    await userEvent.click(screen.getByText('Waiting'));
    await userEvent.click(screen.getByText('Elsewhere'));

    expect(onOpen).toHaveBeenCalledTimes(1);
    expect(onOpen).toHaveBeenCalledWith(aServer().id);
  });

  it('withdraws an open invite', async () => {
    drawn([aServer()], vi.fn(), [INVITE]);

    await userEvent.click(screen.getByRole('button', { name: 'Revoke' }));

    await waitFor(() => {
      expect(withdrawLinkInvite).toHaveBeenCalledWith(INVITE.id);
    });
  });

  it('sets a display name so devtools can identify it', () => {
    expect(LinkedServerList.displayName).toBe('LinkedServerList');
  });
});
