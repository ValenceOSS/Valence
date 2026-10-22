import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import { HouseholdStep } from './HouseholdStep';
import type * as FetchProfiles from '@ValenceClient/profiles/fetchProfiles';
import type { Household, Onboarding } from '@ValenceContracts/schemas/Household';
import type { ProfileColour, ViewerProfile } from '@ValenceContracts/schemas/ViewerProfile';
import type { HouseholdStepProps } from './HouseholdStep.types';
import { DEFAULT_DISCORD_PRESENCE } from '@ValenceContracts/schemas/DiscordPresence';
import { PLUS_JAKARTA_SANS_AS_STORED } from '@ValenceContracts/schemas/LetterFont';

const HOUSEHOLD: Household = {
  name: 'Dan',
  colour: '#3ac47d',
  avatar: { kind: 'initial', font: PLUS_JAKARTA_SANS_AS_STORED },
  updatedAt: '2026-09-18T00:00:00.000Z',
};

const aProfile = (id: string, name: string): ViewerProfile => ({
  id,
  name,
  colour: '#3a8ee8',
  avatar: { kind: 'initial', font: PLUS_JAKARTA_SANS_AS_STORED },
  askStillWatchingAfter: 4,
  showsWhatIamWatching: false,
  discordPresence: DEFAULT_DISCORD_PRESENCE,
  prefersBestCopy: false,
  isOwner: true,
  hasPin: false,
  mayRequest: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
});

const ME = aProfile('00000000-0000-4000-8000-000000000001', 'Marques');

const SAM = { ...aProfile('00000000-0000-4000-8000-000000000002', 'Sam'), isOwner: false };

const fetchOnboarding = vi.hoisted(() => vi.fn<() => Promise<Onboarding>>());
const saveHousehold = vi.hoisted(() =>
  vi.fn<(request: { name?: string }) => Promise<Household | null>>(),
);
const fetchProfiles = vi.hoisted(() => vi.fn<() => Promise<ViewerProfile[]>>());
const createProfile = vi.hoisted(() =>
  vi.fn<(name: string, colour: ProfileColour) => Promise<boolean>>(),
);
const removeProfile = vi.hoisted(() => vi.fn<(profileId: string) => Promise<boolean>>());

vi.mock('@ValenceClient/household/fetchHousehold', () => ({
  fetchOnboarding,
  saveHousehold,
  uploadHouseholdPhoto: vi.fn(),
  finishOnboarding: vi.fn(),
}));

vi.mock('@ValenceClient/profiles/fetchProfileList', () => ({
  fetchProfileList: async () => ({ profiles: await fetchProfiles(), chosenProfileId: ME.id }),
}));

vi.mock('@ValenceClient/profiles/fetchProfiles', async (importOriginal) => ({
  ...(await importOriginal<typeof FetchProfiles>()),
  fetchProfiles,
  createProfile,
  removeProfile,
}));

const renderStep = (props: Partial<HouseholdStepProps> = {}) =>
  render(<HouseholdStep onBack={vi.fn()} onContinue={vi.fn()} {...props} />, {
    wrapper: CacheScope,
  });

beforeEach(() => {
  fetchOnboarding.mockReset().mockResolvedValue({ isOnboarded: false, household: HOUSEHOLD });
  saveHousehold.mockReset().mockResolvedValue(HOUSEHOLD);
  fetchProfiles.mockReset().mockResolvedValue([ME, SAM]);
  createProfile.mockReset().mockResolvedValue(true);
  removeProfile.mockReset().mockResolvedValue(true);
});

describe('HouseholdStep', () => {
  it('reads who watches here before letting anybody on', async () => {
    renderStep();

    expect(screen.getByRole('status', { name: 'Loading profiles' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Continue' })).toBeDisabled();

    await screen.findByRole('list');

    expect(screen.getByRole('button', { name: 'Continue' })).toBeEnabled();
  });

  it('asks nothing about the account’s own name or picture, which the profile step chose', async () => {
    renderStep();

    await screen.findByRole('list');

    expect(screen.queryByRole('textbox', { name: 'Display name' })).not.toBeInTheDocument();
    expect(screen.queryByText('Choose a picture')).not.toBeInTheDocument();
  });

  it('lists everybody on the account, marking the owner', async () => {
    renderStep();

    const list = await screen.findByRole('list');

    await waitFor(() => {
      expect(within(list).getByText('Sam')).toBeInTheDocument();
    });
    expect(within(list).getByText('Owner')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Remove Marques' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Remove Sam' })).toBeInTheDocument();
  });

  it('removes somebody and reads the people again', async () => {
    renderStep();

    await userEvent.click(await screen.findByRole('button', { name: 'Remove Sam' }));

    await waitFor(() => {
      expect(removeProfile).toHaveBeenCalledWith(SAM.id);
    });
    await waitFor(() => {
      expect(fetchProfiles.mock.calls.length).toBeGreaterThan(1);
    });
  });

  it('adds somebody by the name typed, with a colour of their own', async () => {
    renderStep();

    const field = await screen.findByLabelText('Add a profile');

    expect(screen.getByRole('button', { name: 'Add' })).toBeDisabled();

    await userEvent.type(field, '  Alex  {Enter}');

    await waitFor(() => {
      expect(createProfile).toHaveBeenCalledWith('Alex', expect.stringMatching(/^#/));
    });
    await waitFor(() => {
      expect(field).toHaveValue('');
    });
  });

  it('does not add somebody with only spaces for a name', async () => {
    renderStep();

    await userEvent.type(await screen.findByLabelText('Add a profile'), '   {Enter}');

    expect(createProfile).not.toHaveBeenCalled();
  });

  it('says when somebody could not be added, and keeps what was typed', async () => {
    createProfile.mockResolvedValue(false);

    renderStep();

    const field = await screen.findByLabelText('Add a profile');

    await userEvent.type(field, 'Alex');
    await userEvent.click(screen.getByRole('button', { name: 'Add' }));

    expect(await screen.findByText('Couldn’t add that profile. Try again.')).toBeInTheDocument();
    expect(field).toHaveValue('Alex');
  });

  it('goes on, saving nothing of the account’s own', async () => {
    const onContinue = vi.fn();

    renderStep({ onContinue });

    await screen.findByRole('list');
    await userEvent.click(screen.getByRole('button', { name: 'Continue' }));

    await waitFor(() => {
      expect(onContinue).toHaveBeenCalled();
    });
    expect(saveHousehold).not.toHaveBeenCalled();
  });
});
