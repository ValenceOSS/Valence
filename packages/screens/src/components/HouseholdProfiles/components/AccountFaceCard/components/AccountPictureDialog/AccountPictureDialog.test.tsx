import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { notify } from '@ValenceUI/notify';
import { AccountPictureDialog } from './AccountPictureDialog';
import type * as Notify from '@ValenceUI/notify';
import type { Household, HouseholdRequest } from '@ValenceContracts/schemas/Household';

const saveHousehold = vi.hoisted(() =>
  vi.fn<(request: HouseholdRequest) => Promise<Household | null>>(),
);
const uploadHouseholdPhoto = vi.hoisted(() => vi.fn<(file: File) => Promise<string | null>>());

vi.mock('@ValenceClient/household/fetchHousehold', () => ({ saveHousehold, uploadHouseholdPhoto }));

vi.mock('@ValenceUI/notify', async (importOriginal) => {
  const original = await importOriginal<typeof Notify>();

  return { ...original, notify: { ...original.notify, failed: vi.fn() } };
});

const HOUSEHOLD: Household = {
  name: 'Dan',
  colour: '#3a8ee8',
  avatar: {
    kind: 'orb',
    orb: 'cloud',
    params: {},
    colours: { light: '#4a5ce8', shadow: '#e83a90' },
  },
  updatedAt: '2026-10-20T00:00:00.000Z',
  hasOwnName: false,
  hasOwnPicture: false,
};

/**
 * Opens the dialog over an account that follows its owner's orb.
 *
 * @returns What it was told.
 */
const draw = () => {
  const onSaved = vi.fn();
  const onClose = vi.fn();

  render(
    <AccountPictureDialog
      isOpen
      seed="p-dan"
      household={HOUSEHOLD}
      onClose={onClose}
      onSaved={onSaved}
    />,
  );

  return { onSaved, onClose, actor: userEvent.setup() };
};

beforeEach(() => {
  saveHousehold.mockReset().mockResolvedValue(HOUSEHOLD);
  uploadHouseholdPhoto.mockReset().mockResolvedValue(null);
  vi.mocked(notify.failed).mockReset();
});

describe('AccountPictureDialog', () => {
  it('keeps only the colour where nothing of the account’s own was chosen', async () => {
    const { onSaved, actor } = draw();

    await actor.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(onSaved).toHaveBeenCalled();
    });
    expect(saveHousehold).toHaveBeenCalledWith({ colour: '#3a8ee8' });
    expect(uploadHouseholdPhoto).not.toHaveBeenCalled();
  });

  it('offers no initial, since without a picture of its own the account wears its owner’s', () => {
    draw();

    expect(screen.queryByRole('button', { name: /initial/ })).not.toBeInTheDocument();
  });

  it('says why a picture was not kept, and stays open', async () => {
    uploadHouseholdPhoto.mockResolvedValue('The picture must be 6 MB or smaller.');

    const { onSaved, actor } = draw();

    await actor.upload(
      screen.getByLabelText(/Upload a picture/),
      new File(['x'], 'face.png', { type: 'image/png' }),
    );
    await actor.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(notify.failed).toHaveBeenCalledWith('The picture must be 6 MB or smaller.');
    });
    expect(saveHousehold).not.toHaveBeenCalled();
    expect(onSaved).not.toHaveBeenCalled();
  });
});
