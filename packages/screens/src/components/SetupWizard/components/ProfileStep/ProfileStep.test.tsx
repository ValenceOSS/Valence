import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import { ProfileStep } from './ProfileStep';
import type * as FetchProfiles from '@ValenceClient/profiles/fetchProfiles';
import type { ViewerProfile } from '@ValenceContracts/schemas/ViewerProfile';
import type { ProfileDraft } from '@ValenceScreens/components/ProfileSettings/ProfileSettings.types';

const PROFILE: ViewerProfile = {
  id: '00000000-0000-4000-8000-000000000001',
  name: 'Marques',
  colour: '#3a8ee8',
  avatar: { kind: 'initial', font: 'gilroy' },
  askStillWatchingAfter: 4,
  showsWhatIamWatching: false,
  prefersBestCopy: false,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const fetchProfiles = vi.hoisted(() => vi.fn<() => Promise<ViewerProfile[]>>());
const saveProfileDraft = vi.hoisted(() =>
  vi.fn<(profile: ViewerProfile, draft: ProfileDraft) => Promise<boolean>>(),
);

vi.mock('@ValenceClient/profiles/fetchProfiles', async (importOriginal) => ({
  ...(await importOriginal<typeof FetchProfiles>()),
  fetchProfiles,
}));

vi.mock('@ValenceScreens/profiles/saveProfileDraft', () => ({ saveProfileDraft }));

const renderStep = (onContinue = vi.fn()) =>
  render(<ProfileStep onContinue={onContinue} />, { wrapper: CacheScope });

beforeEach(() => {
  fetchProfiles.mockReset().mockResolvedValue([PROFILE]);
  saveProfileDraft.mockReset().mockResolvedValue(true);
});

describe('ProfileStep', () => {
  it('reads the profile before offering to edit it', async () => {
    renderStep();

    expect(screen.getByRole('status', { name: 'Loading your profile' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Continue' })).toBeDisabled();

    expect(await screen.findByRole('textbox', { name: 'Display name' })).toBeInTheDocument();
  });

  it('saves what was changed to the profile, then goes on', async () => {
    const onContinue = vi.fn();

    renderStep(onContinue);

    await userEvent.type(await screen.findByRole('textbox', { name: 'Display name' }), 'Dan');
    await userEvent.click(screen.getByRole('button', { name: 'Continue' }));

    await waitFor(() => {
      expect(onContinue).toHaveBeenCalledOnce();
    });
    expect(saveProfileDraft).toHaveBeenCalledWith(
      PROFILE,
      expect.objectContaining({ name: 'MarquesDan', colour: '#3a8ee8', photo: null }),
    );
  });

  it('stays and says so when the profile was not saved', async () => {
    saveProfileDraft.mockResolvedValue(false);
    const onContinue = vi.fn();

    renderStep(onContinue);

    await screen.findByRole('textbox', { name: 'Display name' });
    await userEvent.click(screen.getByRole('button', { name: 'Continue' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Couldn’t save your changes.');
    expect(onContinue).not.toHaveBeenCalled();
  });

  it('goes on without saving where the account has no profile to save', async () => {
    fetchProfiles.mockResolvedValue([]);
    const onContinue = vi.fn();

    renderStep(onContinue);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Continue' })).toBeEnabled();
    });
    await userEvent.click(screen.getByRole('button', { name: 'Continue' }));

    expect(onContinue).toHaveBeenCalledOnce();
    expect(saveProfileDraft).not.toHaveBeenCalled();
  });
});
