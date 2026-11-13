import type { PhotoFrame } from '@ValenceContracts/schemas/ViewerProfile';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import { ThisServerCard } from './ThisServerCard';
import type { LinkIdentity, LinkIdentityChange } from '@ValenceContracts/schemas/LinkedServer';

Object.defineProperty(URL, 'createObjectURL', {
  configurable: true,
  value: () => 'blob:chosen',
});
Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: () => undefined });

const changeLinkIdentity =
  vi.fn<
    (
      change: LinkIdentityChange,
    ) => Promise<{ value: LinkIdentity | null; refusal: { message: string } | null }>
  >();

vi.mock('@ValenceClient/admin/changeLinkIdentity', () => ({
  changeLinkIdentity: (change: LinkIdentityChange) => changeLinkIdentity(change),
}));

const changeServerPicture =
  vi.fn<(file: File | null, frame?: PhotoFrame | null) => Promise<{ refusal: string | null }>>();

vi.mock('@ValenceClient/admin/changeServerPicture', () => ({
  changeServerPicture: (file: File | null, frame?: PhotoFrame | null) =>
    changeServerPicture(file, frame),
}));

const PICTURE = new File(['bytes'], 'server.png', { type: 'image/png' });

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
  changeServerPicture.mockReset().mockResolvedValue({ refusal: null });
});

describe('ThisServerCard', () => {
  it('shows the fingerprint to read out, in groups', () => {
    renderInAnAddress(<ThisServerCard identity={IDENTITY} />);

    expect(screen.getByText('0123 4567 89ab cdef')).toBeInTheDocument();
  });

  it('saves a new name with its own button, once something has changed', async () => {
    renderInAnAddress(<ThisServerCard identity={IDENTITY} />);

    expect(screen.queryByRole('button', { name: 'Save' })).not.toBeInTheDocument();

    const name = screen.getByRole('textbox', { name: 'Name' });

    await userEvent.clear(name);
    await userEvent.type(name, 'Kai’s Valence');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(changeLinkIdentity).toHaveBeenCalledWith({ name: 'Kai’s Valence' });
    });
  });

  it('drops requests a linked server has as soon as it is switched', async () => {
    renderInAnAddress(<ThisServerCard identity={IDENTITY} />);

    await userEvent.click(
      screen.getByRole('switch', { name: 'Remove requests a linked server already has' }),
    );

    await waitFor(() => {
      expect(changeLinkIdentity).toHaveBeenCalledWith({ dropsRequestsElsewhere: true });
    });
  });

  it('sends a new picture once it is placed in its circle', async () => {
    renderInAnAddress(<ThisServerCard identity={IDENTITY} />);

    await userEvent.upload(screen.getByLabelText(/Choose a picture/u), PICTURE);

    expect(changeServerPicture).not.toHaveBeenCalled();

    await userEvent.click(await screen.findByRole('button', { name: 'Use this picture' }));

    await waitFor(() => {
      expect(changeServerPicture).toHaveBeenCalledWith(PICTURE, { zoom: 1, x: 0, y: 0 });
    });
    expect(changeLinkIdentity).not.toHaveBeenCalled();
  });

  it('offers to remove a picture only once there is one, and removes it at once', async () => {
    const { unmount } = renderInAnAddress(<ThisServerCard identity={IDENTITY} />);

    expect(screen.queryByRole('button', { name: 'Remove picture' })).not.toBeInTheDocument();

    unmount();
    renderInAnAddress(
      <ThisServerCard identity={{ ...IDENTITY, pictureAt: '2026-10-20T00:00:00.000Z' }} />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Remove picture' }));

    await waitFor(() => {
      expect(changeServerPicture).toHaveBeenCalledWith(null, null);
    });
  });

  it('warns that an address only this machine can reach will not do for other servers', () => {
    renderInAnAddress(
      <ThisServerCard identity={{ ...IDENTITY, address: 'http://localhost:8420' }} />,
    );

    expect(screen.getByText('Not reachable from other servers')).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(ThisServerCard.displayName).toBe('ThisServerCard');
  });
});
