import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import { notify } from '@ValenceUI/notify';
import { InviteCard } from './InviteCard';
import type { Refusal } from '@ValenceClient/admin/readRefusal';
import type { Sent } from '@ValenceClient/requests/sendToRequests';
import type { MadeLinkInvite } from '@ValenceContracts/schemas/LinkedServer';

const makeLinkInvite = vi.fn<() => Promise<Sent<MadeLinkInvite | null>>>();

const withdrawLinkInvite = vi.fn<(id: string) => Promise<Refusal>>();

vi.mock('@ValenceClient/admin/makeLinkInvite', () => ({
  makeLinkInvite: () => makeLinkInvite(),
}));

vi.mock('@ValenceUI/notify', () => ({
  notify: { worked: vi.fn(), failed: vi.fn(), say: vi.fn() },
}));

vi.mock('@ValenceClient/admin/withdrawLinkInvite', () => ({
  withdrawLinkInvite: (id: string) => withdrawLinkInvite(id),
}));

const AN_INVITE = {
  id: '00000000-0000-4000-8000-000000000002',
  createdAt: '2026-10-02T12:00:00.000Z',
  expiresAt: '2026-10-03T12:00:00.000Z',
};

beforeEach(() => {
  makeLinkInvite
    .mockReset()
    .mockResolvedValue({ value: { ...AN_INVITE, invite: 'valence-link:abc' }, refusal: null });
  withdrawLinkInvite.mockReset().mockResolvedValue(null);
});

describe('InviteCard', () => {
  it('shows a new invite the once, to copy', async () => {
    renderInAnAddress(<InviteCard invites={[]} />);

    await userEvent.click(screen.getByRole('button', { name: /Make an invite/u }));

    expect(await screen.findByLabelText('The invite')).toHaveTextContent('valence-link:abc');
    expect(screen.getByText('Copy it now. It is not shown again.')).toBeInTheDocument();
  });

  it('withdraws an open invite', async () => {
    renderInAnAddress(<InviteCard invites={[AN_INVITE]} />);

    await userEvent.click(screen.getByRole('button', { name: /^Withdraw the invite made/u }));

    await waitFor(() => {
      expect(withdrawLinkInvite).toHaveBeenCalledWith(AN_INVITE.id);
    });
  });

  it('says so where the invite could not be copied, since it is not shown again', async () => {
    const actor = userEvent.setup();

    vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(new Error('not allowed'));
    renderInAnAddress(<InviteCard invites={[]} />);

    await actor.click(screen.getByRole('button', { name: /Make an invite/u }));
    await actor.click(await screen.findByRole('button', { name: 'Copy' }));

    await waitFor(() => {
      expect(notify.failed).toHaveBeenCalledWith(
        'The invite couldn’t be copied. Select it and copy it by hand, since it is not shown again.',
      );
    });
    expect(screen.queryByText('Copied')).toBeNull();
  });
});
