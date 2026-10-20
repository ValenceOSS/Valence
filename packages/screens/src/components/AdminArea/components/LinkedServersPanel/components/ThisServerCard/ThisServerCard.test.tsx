import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import { ThisServerCard } from './ThisServerCard';
import type { LinkIdentity, LinkIdentityChange } from '@ValenceContracts/schemas/LinkedServer';

const changeLinkIdentity =
  vi.fn<
    (
      change: LinkIdentityChange,
    ) => Promise<{ value: LinkIdentity | null; refusal: { message: string } | null }>
  >();

vi.mock('@ValenceClient/admin/changeLinkIdentity', () => ({
  changeLinkIdentity: (change: LinkIdentityChange) => changeLinkIdentity(change),
}));

const changeServerPicture = vi.fn<(file: File | null) => Promise<{ refusal: string | null }>>();

vi.mock('@ValenceClient/admin/changeServerPicture', () => ({
  changeServerPicture: (file: File | null) => changeServerPicture(file),
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

  it('drops requests a linked server has once saved, not when switched', async () => {
    renderInAnAddress(<ThisServerCard identity={IDENTITY} />);

    await userEvent.click(
      screen.getByRole('switch', { name: 'Remove requests a linked server already has' }),
    );

    expect(changeLinkIdentity).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(changeLinkIdentity).toHaveBeenCalledWith(
        expect.objectContaining({ dropsRequestsElsewhere: true }),
      );
    });
  });

  it('sends a new picture once saved, not when chosen', async () => {
    renderInAnAddress(<ThisServerCard identity={IDENTITY} />);

    await userEvent.upload(screen.getByLabelText(/Choose a picture/u), PICTURE);

    expect(changeServerPicture).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(changeLinkIdentity).toHaveBeenCalled();
    });
    expect(changeServerPicture).toHaveBeenCalledWith(PICTURE);
  });

  it('keeps a picture that was saved even when the rest is refused, so it is not sent twice', async () => {
    changeLinkIdentity.mockResolvedValue({ value: null, refusal: { message: 'No.' } });

    renderInAnAddress(<ThisServerCard identity={IDENTITY} />);

    await userEvent.upload(screen.getByLabelText(/Choose a picture/u), PICTURE);
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(changeLinkIdentity).toHaveBeenCalled();
    });
    expect(changeServerPicture).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
  });

  it('removes the picture once saved, and keeps the rest when the picture is refused', async () => {
    changeServerPicture.mockResolvedValue({ refusal: 'That picture could not be removed.' });

    renderInAnAddress(
      <ThisServerCard identity={{ ...IDENTITY, pictureAt: '2026-10-20T00:00:00.000Z' }} />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Remove picture' }));
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(changeServerPicture).toHaveBeenCalledWith(null);
    });
    expect(changeLinkIdentity).not.toHaveBeenCalled();
  });
});
