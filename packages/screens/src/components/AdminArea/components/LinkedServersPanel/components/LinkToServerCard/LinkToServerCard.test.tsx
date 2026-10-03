import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import { LinkToServerCard } from './LinkToServerCard';
import type { Sent } from '@ValenceClient/requests/sendToRequests';
import type { LinkedServer } from '@ValenceContracts/schemas/LinkedServer';

const linkWithInvite = vi.fn<(invite: string) => Promise<Sent<LinkedServer | null>>>();

vi.mock('@ValenceClient/admin/linkWithInvite', () => ({
  linkWithInvite: (invite: string) => linkWithInvite(invite),
}));

const FILMS: LinkedServer = {
  id: '00000000-0000-4000-8000-000000000001',
  name: 'Films',
  colour: '#e8503a',
  address: 'https://films.example',
  fingerprint: 'fedcba9876543210',
  state: 'awaitingThem',
  createdAt: '2026-10-02T12:00:00.000Z',
  linkedAt: null,
  lastSeenAt: null,
};

beforeEach(() => {
  linkWithInvite.mockReset().mockResolvedValue({
    value: FILMS,
    refusal: null,
  });
});

describe('LinkToServerCard', () => {
  it('links with the invite pasted in, once there is one', async () => {
    renderInAnAddress(<LinkToServerCard />);

    const link = screen.getByRole('button', { name: 'Link' });

    expect(link).toBeDisabled();

    await userEvent.type(screen.getByLabelText('Their invite'), '  valence-link:abc ');
    await userEvent.click(link);

    await waitFor(() => {
      expect(linkWithInvite).toHaveBeenCalledWith('valence-link:abc');
    });
  });
});
