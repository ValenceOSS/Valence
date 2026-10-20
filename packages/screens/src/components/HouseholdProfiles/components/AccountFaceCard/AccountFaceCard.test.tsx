import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import { notify } from '@ValenceUI/notify';
import { AccountFaceCard } from './AccountFaceCard';
import type * as Notify from '@ValenceUI/notify';
import type { Household, HouseholdRequest, Onboarding } from '@ValenceContracts/schemas/Household';

const FOLLOWING: Household = {
  name: 'Dan',
  colour: '#3a8ee8',
  avatar: { kind: 'photo', isVideo: false, frame: null },
  updatedAt: '2026-10-20T00:00:00.000Z',
  hasOwnName: false,
  hasOwnPicture: false,
};

const OWN: Household = {
  ...FOLLOWING,
  name: 'The Morgans',
  hasOwnName: true,
  hasOwnPicture: true,
};

const fetchOnboarding = vi.hoisted(() => vi.fn<() => Promise<Onboarding>>());
const saveHousehold = vi.hoisted(() =>
  vi.fn<(request: HouseholdRequest) => Promise<Household | null>>(),
);
const uploadHouseholdPhoto = vi.hoisted(() => vi.fn<(file: File) => Promise<string | null>>());

vi.mock('@ValenceClient/household/fetchHousehold', () => ({
  fetchOnboarding,
  saveHousehold,
  uploadHouseholdPhoto,
}));

vi.mock('@ValenceUI/notify', async (importOriginal) => {
  const original = await importOriginal<typeof Notify>();

  return { ...original, notify: { ...original.notify, failed: vi.fn() } };
});

/**
 * Draws the card for an account standing as given.
 *
 * @param household - What the account looks like.
 * @returns Somebody to use it.
 */
const draw = (household: Household) => {
  fetchOnboarding.mockResolvedValue({ isOnboarded: true, household });
  render(<AccountFaceCard ownerId="p-dan" ownerName="Dan" />, { wrapper: CacheScope });

  return userEvent.setup();
};

beforeEach(() => {
  fetchOnboarding.mockReset();
  saveHousehold.mockReset().mockResolvedValue(FOLLOWING);
  uploadHouseholdPhoto.mockReset().mockResolvedValue(null);
  vi.mocked(notify.failed).mockReset();
});

describe('AccountFaceCard', () => {
  it('leaves the name empty while the account goes by its owner’s, and says whose', async () => {
    draw(FOLLOWING);

    const field = await screen.findByRole('textbox', { name: 'Name' });

    expect(field).toHaveValue('');
    expect(field).toHaveAttribute('placeholder', 'Dan');
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
  });

  it('gives the account a name of its own, without the spaces around it', async () => {
    const actor = draw(FOLLOWING);

    await actor.type(await screen.findByRole('textbox', { name: 'Name' }), '  The Morgans  ');
    await actor.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(saveHousehold).toHaveBeenCalledWith({ name: 'The Morgans' });
    });
  });

  it('goes back to the owner’s name at a press, as the picture does', async () => {
    const actor = draw(OWN);

    expect(
      await screen.findByText(
        'Shows on the sign-in screen and beside requests, instead of your profile name.',
      ),
    ).toBeInTheDocument();

    await actor.click(screen.getByRole('button', { name: 'Use my profile name' }));

    await waitFor(() => {
      expect(saveHousehold).toHaveBeenCalledWith({ name: null });
    });
  });

  it('says the picture stands in for the profile’s once the account has its own', async () => {
    draw(OWN);

    expect(
      await screen.findByText('Shows on the sign-in screen, instead of your profile picture.'),
    ).toBeInTheDocument();
  });

  it('goes back to the owner’s name when the account’s own is cleared', async () => {
    const actor = draw(OWN);

    await actor.clear(await screen.findByRole('textbox', { name: 'Name' }));
    await actor.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(saveHousehold).toHaveBeenCalledWith({ name: null });
    });
  });

  it('offers to go back to the profile picture only once the account has its own', async () => {
    draw(FOLLOWING);

    await screen.findByRole('textbox', { name: 'Name' });

    expect(
      screen.queryByRole('button', { name: 'Use my profile picture' }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Use my profile name' })).not.toBeInTheDocument();
  });

  it('drops the account’s own picture when asked to use the profile picture again', async () => {
    const actor = draw(OWN);

    await actor.click(await screen.findByRole('button', { name: 'Use my profile picture' }));

    await waitFor(() => {
      expect(saveHousehold).toHaveBeenCalledWith({ avatar: null });
    });
  });

  it('keeps a picture of the account’s own once the dialog is saved', async () => {
    const actor = draw(FOLLOWING);
    const picture = new File(['x'], 'face.png', { type: 'image/png' });

    await actor.click(await screen.findByRole('button', { name: 'Choose a picture' }));
    await actor.upload(await screen.findByLabelText(/Upload a picture/), picture);

    expect(uploadHouseholdPhoto).not.toHaveBeenCalled();

    await actor.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(uploadHouseholdPhoto).toHaveBeenCalledWith(picture);
    });
    expect(saveHousehold).toHaveBeenCalledWith({ colour: '#3a8ee8' });
  });

  it('keeps a drawn face of the account’s own, and its colour', async () => {
    const actor = draw(FOLLOWING);

    await actor.click(await screen.findByRole('button', { name: 'Choose a picture' }));
    await actor.click(await screen.findByRole('button', { name: 'Use the bottts avatar' }));
    await actor.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(saveHousehold).toHaveBeenCalledWith({
        colour: '#3a8ee8',
        avatar: { kind: 'drawn', style: 'bottts', seed: 'p-dan' },
      });
    });
  });

  it('says why a picture or a change was not kept', async () => {
    saveHousehold.mockResolvedValue(null);

    const actor = draw(OWN);

    await actor.click(await screen.findByRole('button', { name: 'Use my profile picture' }));

    await waitFor(() => {
      expect(notify.failed).toHaveBeenCalledWith('Couldn’t save your changes.');
    });
  });
});
