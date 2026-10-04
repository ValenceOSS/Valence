import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import { FaceEditor } from './FaceEditor';
import type { ViewerProfile } from '@ValenceContracts/schemas/ViewerProfile';

const PROFILE: ViewerProfile = {
  id: '00000000-0000-4000-8000-000000000002',
  name: 'Marques',
  colour: '#3a8ee8',
  avatar: { kind: 'initial', font: 'gilroy' },
  askStillWatchingAfter: 4,
  showsWhatIamWatching: false,
  prefersBestCopy: false,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const START = { avatar: PROFILE.avatar, photo: null, colour: PROFILE.colour };

describe('FaceEditor', () => {
  it('opens on the kind of face somebody already has', () => {
    renderInAnAddress(
      <FaceEditor isOpen onClose={vi.fn()} profile={PROFILE} start={START} onUse={vi.fn()} />,
    );

    expect(screen.getByRole('button', { name: 'Set it in Gilroy' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('hands over the letter face it was changed to', async () => {
    const onUse = vi.fn();

    renderInAnAddress(
      <FaceEditor isOpen onClose={vi.fn()} profile={PROFILE} start={START} onUse={onUse} />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Set it in Manrope' }));
    await userEvent.click(screen.getByRole('button', { name: 'Use this picture' }));

    await waitFor(() => {
      expect(onUse).toHaveBeenCalledWith({
        avatar: { kind: 'initial', font: 'manrope' },
        photo: null,
        colour: PROFILE.colour,
      });
    });
  });

  it('is put away without using anything', async () => {
    const onClose = vi.fn();
    const onUse = vi.fn();

    renderInAnAddress(
      <FaceEditor isOpen onClose={onClose} profile={PROFILE} start={START} onUse={onUse} />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onClose).toHaveBeenCalled();
    expect(onUse).not.toHaveBeenCalled();
  });

  it('will not use a photo face before there is a photo', async () => {
    renderInAnAddress(
      <FaceEditor isOpen onClose={vi.fn()} profile={PROFILE} start={START} onUse={vi.fn()} />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Photo' }));

    expect(screen.getByRole('button', { name: 'Use this picture' })).toBeDisabled();
  });
});
