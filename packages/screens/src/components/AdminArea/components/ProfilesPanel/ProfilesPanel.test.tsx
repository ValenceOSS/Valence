import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import { ProfilesPanel } from './ProfilesPanel';
import type { Library } from '@ValenceContracts/schemas/Library';
import type { QualityProfile } from '@ValenceContracts/schemas/QualityProfile';
import type * as Profiles from '@ValenceClient/requests/fetchProfiles';
import { aQualityProfile } from '@ValenceScreens/testing/aQualityProfile';

const fetchProfiles = vi.fn<typeof Profiles.fetchProfiles>();
const removeProfile = vi.fn<typeof Profiles.removeProfile>();
const fetchLibraries = vi.fn<() => Promise<Library[]>>();

vi.mock('@ValenceClient/requests/fetchProfiles', () => ({
  fetchProfiles: () => fetchProfiles(),
  removeProfile: (id: string) => removeProfile(id),
  addProfile: vi.fn(),
  changeProfile: vi.fn(),
}));

vi.mock('@ValenceClient/library/fetchLibrary', async (actual) => ({
  ...(await actual<object>()),
  fetchLibraries: () => fetchLibraries(),
}));

const HD = aQualityProfile({
  resolutions: ['1080p'],
  sources: ['bluray'],
  libraryIds: ['films', 'gone'],
});

const LOSSLESS: QualityProfile = {
  ...HD,
  id: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
  name: 'Lossless',
  kind: 'music',
  musicQualities: ['flac'],
  libraryIds: [],
};

beforeEach(() => {
  fetchProfiles.mockReset().mockResolvedValue([HD, LOSSLESS]);
  removeProfile.mockReset().mockResolvedValue(null);
  fetchLibraries.mockReset().mockResolvedValue([
    {
      id: 'films',
      name: 'Films',
      kind: 'movies',
      path: '/media/films',
      itemCount: 0,
      lastScannedAt: null,
      defaultAudioLanguage: null,
      filesAtOnce: null,
      takesRequests: true,
      requestProfileId: null,
      requestPath: null,
    },
  ]);
});

/**
 * The row naming a profile.
 */
const rowOf = (name: string) =>
  screen.getAllByRole('row').find((row) => row.textContent.includes(name)) ?? document.body;

describe('ProfilesPanel', () => {
  it('lists each profile, what it takes, and the libraries it is for', async () => {
    renderInAnAddress(<ProfilesPanel />);

    await screen.findByText('HD');

    await waitFor(() => {
      expect(within(rowOf('HD')).getByText('Films, A library that has gone')).toBeInTheDocument();
    });
    expect(within(rowOf('HD')).getByText('1080p · Blu-ray')).toBeInTheDocument();
  });

  it('shows films and series first, and music behind its own tab', async () => {
    const user = userEvent.setup();

    renderInAnAddress(<ProfilesPanel />);

    expect(await screen.findByText('HD')).toBeInTheDocument();
    expect(screen.queryByText('Lossless')).not.toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'Music' }));

    expect(await screen.findByText('Lossless')).toBeInTheDocument();
    expect(within(rowOf('Lossless')).getByText('Every library')).toBeInTheDocument();
    expect(screen.queryByText('HD')).not.toBeInTheDocument();
  });

  it('opens the dialog to add a profile, and to change one', async () => {
    const user = userEvent.setup();

    renderInAnAddress(<ProfilesPanel />);

    await user.click(screen.getByRole('button', { name: 'Add media profile' }));

    expect(await screen.findByText(/Every release a search finds is judged/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    await user.click(await screen.findByRole('button', { name: 'Actions for HD' }));
    await user.click(await screen.findByRole('menuitem', { name: /Change/ }));

    expect(await screen.findByText('Change HD')).toBeInTheDocument();
  });

  it('removes a profile once that is confirmed, saying why where it could not', async () => {
    removeProfile.mockResolvedValueOnce({ message: 'Requesting is off.' });

    const user = userEvent.setup();

    renderInAnAddress(<ProfilesPanel />);

    await user.click(await screen.findByRole('button', { name: 'Actions for HD' }));
    await user.click(await screen.findByRole('menuitem', { name: /Remove/ }));
    await user.click(await screen.findByRole('button', { name: 'Remove' }));

    expect(removeProfile).toHaveBeenCalledWith(HD.id);
    expect(await screen.findByRole('alert')).toHaveTextContent('Requesting is off.');

    await user.click(screen.getByRole('button', { name: 'Actions for HD' }));
    await user.click(await screen.findByRole('menuitem', { name: /Remove/ }));
    await user.click(await screen.findByRole('button', { name: 'Cancel' }));

    expect(removeProfile).toHaveBeenCalledTimes(1);
  });

  it('says it could not read the profiles, and tries again', async () => {
    fetchProfiles.mockRejectedValue(new Error('offline'));

    const user = userEvent.setup();

    renderInAnAddress(<ProfilesPanel />);

    await user.click(await screen.findByRole('button', { name: /try again/i }));

    expect(fetchProfiles).toHaveBeenCalledTimes(2);
  });

  it('says it is reading, and what to do while there are none', async () => {
    let answer: (profiles: QualityProfile[]) => void = () => undefined;

    fetchProfiles.mockReturnValue(
      new Promise((resolve) => {
        answer = resolve;
      }),
    );

    renderInAnAddress(<ProfilesPanel />);

    expect(screen.getByRole('status', { name: 'Reading the profiles' })).toBeInTheDocument();

    answer([]);

    expect(await screen.findByText('No profiles for films or series yet.')).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(ProfilesPanel.displayName).toBe('ProfilesPanel');
  });
});
