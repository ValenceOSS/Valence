import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import { ThisServerCard } from './ThisServerCard';
import type { LinkIdentity, LinkIdentityChange } from '@ValenceContracts/schemas/LinkedServer';

const changeLinkIdentity =
  vi.fn<(change: LinkIdentityChange) => Promise<{ value: LinkIdentity | null; refusal: null }>>();

vi.mock('@ValenceClient/admin/changeLinkIdentity', () => ({
  changeLinkIdentity: (change: LinkIdentityChange) => changeLinkIdentity(change),
}));

const IDENTITY: LinkIdentity = {
  name: 'Anime',
  colour: '#3a8ee8',
  address: 'https://anime.example',
  dropsRequestsElsewhere: false,
  pictureAt: null,
  protocols: ['valence-link/1'],
  publicKey: { kty: 'OKP', crv: 'Ed25519', x: 'AAAA' },
  fingerprint: '0123456789abcdef',
};

beforeEach(() => {
  changeLinkIdentity.mockReset().mockResolvedValue({ value: IDENTITY, refusal: null });
});

describe('ThisServerCard', () => {
  it('shows the fingerprint to read out, in groups', () => {
    renderInAnAddress(<ThisServerCard identity={IDENTITY} />);

    expect(screen.getByText('0123 4567 89ab cdef')).toBeInTheDocument();
  });

  it('saves a new name, and only once something has changed', async () => {
    renderInAnAddress(<ThisServerCard identity={IDENTITY} />);

    const save = screen.getByRole('button', { name: 'Save' });

    expect(save).toBeDisabled();

    await userEvent.clear(screen.getByLabelText('Name'));
    await userEvent.type(screen.getByLabelText('Name'), 'Kai’s Valence');
    await userEvent.click(save);

    await waitFor(() => {
      expect(changeLinkIdentity).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Kai’s Valence' }),
      );
    });
  });

  it('drops requests a linked server has, once asked to', async () => {
    renderInAnAddress(<ThisServerCard identity={IDENTITY} />);

    await userEvent.click(
      screen.getByRole('switch', { name: 'Remove requests a linked server already has' }),
    );

    await waitFor(() => {
      expect(changeLinkIdentity).toHaveBeenCalledWith({ dropsRequestsElsewhere: true });
    });
  });
});
