import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import { HouseholdStep } from './HouseholdStep';
import type * as FetchProfiles from '@ValenceClient/profiles/fetchProfiles';
import type { Household, Onboarding } from '@ValenceContracts/schemas/Household';
import type { ProfileColour, ViewerProfile } from '@ValenceContracts/schemas/ViewerProfile';
import type { HouseholdStepProps } from './HouseholdStep.types';

const HOUSEHOLD: Household = {
  name: 'Dan',
  colour: '#3ac47d',
  avatar: { kind: 'initial', font: 'gilroy' },
  updatedAt: '2026-09-18T00:00:00.000Z',
};

const aProfile = (id: string, name: string): ViewerProfile => ({
  id,
  name,
  colour: '#3a8ee8',
  avatar: { kind: 'initial', font: 'gilroy' },
  askStillWatchingAfter: 4,
  showsWhatIamWatching: false,
  prefersBestCopy: false,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
});

const ME = aProfile('00000000-0000-4000-8000-000000000001', 'Marques');

const SAM = aProfile('00000000-0000-4000-8000-000000000002', 'Sam');

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

const NAME_FIELD = /What is this household called/;

beforeEach(() => {
  fetchOnboarding.mockReset().mockResolvedValue({ isOnboarded: false, household: HOUSEHOLD });
  saveHousehold.mockReset().mockResolvedValue(HOUSEHOLD);
  fetchProfiles.mockReset().mockResolvedValue([ME, SAM]);
  createProfile.mockReset().mockResolvedValue(true);
  removeProfile.mockReset().mockResolvedValue(true);
});

describe('HouseholdStep', () => {
  it('reads the household before asking about it', async () => {
    renderStep();

    expect(screen.getByRole('status', { name: 'Reading the household' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Continue' })).toBeDisabled();
    expect(await screen.findByLabelText(NAME_FIELD)).toHaveValue('Dan');
  });

  it('lists everybody on the account, marking the administrator as themselves', async () => {
    renderStep();

    const list = await screen.findByRole('list');

    await waitFor(() => {
      expect(within(list).getByText('Sam')).toBeInTheDocument();
    });
    expect(within(list).getByText('You')).toBeInTheDocument();
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

    const field = await screen.findByLabelText('Add somebody');

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

    await userEvent.type(await screen.findByLabelText('Add somebody'), '   {Enter}');

    expect(createProfile).not.toHaveBeenCalled();
  });

  it('says when somebody could not be added, and keeps what was typed', async () => {
    createProfile.mockResolvedValue(false);

    renderStep();

    const field = await screen.findByLabelText('Add somebody');

    await userEvent.type(field, 'Alex');
    await userEvent.click(screen.getByRole('button', { name: 'Add' }));

    expect(
      await screen.findByText('That person could not be added. Try again.'),
    ).toBeInTheDocument();
    expect(field).toHaveValue('Alex');
  });

  it('saves the name without the spaces around it, then goes on with it', async () => {
    const onContinue = vi.fn();

    renderStep({ onContinue });

    const field = await screen.findByLabelText(NAME_FIELD);

    await userEvent.clear(field);
    await userEvent.type(field, '  The Morgans  ');
    await userEvent.click(screen.getByRole('button', { name: 'Continue' }));

    await waitFor(() => {
      expect(onContinue).toHaveBeenCalledWith('The Morgans');
    });
    expect(saveHousehold).toHaveBeenCalledWith({ name: 'The Morgans' });
  });

  it('will not go on without a name, and clears the complaint once one is typed', async () => {
    const onContinue = vi.fn();

    renderStep({ onContinue });

    const field = await screen.findByLabelText(NAME_FIELD);

    await userEvent.clear(field);
    await userEvent.click(screen.getByRole('button', { name: 'Continue' }));

    expect(await screen.findByText('Give the household a name.')).toBeInTheDocument();
    expect(saveHousehold).not.toHaveBeenCalled();

    await userEvent.type(field, 'A');

    expect(screen.queryByText('Give the household a name.')).not.toBeInTheDocument();
  });

  it('stays where it is when the name could not be saved', async () => {
    saveHousehold.mockResolvedValue(null);
    const onContinue = vi.fn();

    renderStep({ onContinue });

    await screen.findByLabelText(NAME_FIELD);
    await userEvent.click(screen.getByRole('button', { name: 'Continue' }));

    expect(await screen.findByText('That name could not be saved.')).toBeInTheDocument();
    expect(onContinue).not.toHaveBeenCalled();
  });

  it('offers a passkey, and goes back to the profile', async () => {
    const onBack = vi.fn();

    renderStep({ onBack });

    expect(await screen.findByRole('heading', { name: 'Passkey' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Back' }));

    expect(onBack).toHaveBeenCalledOnce();
  });
});
