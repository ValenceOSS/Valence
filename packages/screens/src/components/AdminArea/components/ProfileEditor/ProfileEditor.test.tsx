import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import { ProfileEditor } from './ProfileEditor';
import type { Library } from '@ValenceContracts/schemas/Library';
import type { QualityProfile } from '@ValenceContracts/schemas/QualityProfile';
import type * as Profiles from '@ValenceClient/requests/fetchProfiles';
import { aQualityProfile } from '@ValenceScreens/testing/aQualityProfile';

const addProfile = vi.fn<typeof Profiles.addProfile>();
const changeProfile = vi.fn<typeof Profiles.changeProfile>();
const fetchLibraries = vi.fn<() => Promise<Library[]>>();

vi.mock('@ValenceClient/requests/fetchProfiles', () => ({
  addProfile: (...given: Parameters<typeof Profiles.addProfile>) => addProfile(...given),
  changeProfile: (...given: Parameters<typeof Profiles.changeProfile>) => changeProfile(...given),
}));

vi.mock('@ValenceClient/admin/fetchRoles', async (actual) => ({
  ...(await actual<object>()),
  fetchRoles: () =>
    Promise.resolve([
      { id: 'trusted', name: 'Trusted', position: 200, permissions: [], color: null },
      { id: 'household', name: 'Household', position: 100, permissions: [], color: null },
    ]),
}));

vi.mock('@ValenceClient/admin/fetchAccounts', () => ({
  fetchAccounts: () =>
    Promise.resolve([{ id: 'dan', name: 'Dan', email: 'dan@example.com', roles: [] }]),
}));

vi.mock('@ValenceClient/library/fetchLibrary', async (actual) => ({
  ...(await actual<object>()),
  fetchLibraries: () => fetchLibraries(),
}));

const KEPT = aQualityProfile({
  musicQualities: ['flac'],
  largestMb: 8000,
  preferredWords: ['HDR'],
  bannedWords: ['cam'],
});

/**
 * A library of the kind given.
 */
const aLibrary = (id: string, name: string, kind: Library['kind']): Library => ({
  id,
  name,
  kind,
  path: `/media/${id}`,
  itemCount: 0,
  lastScannedAt: null,
  defaultAudioLanguage: null,
  filesAtOnce: null,
  takesRequests: true,
  requestProfileId: null,
  requestPath: null,
});

beforeEach(() => {
  addProfile.mockReset().mockResolvedValue({ value: KEPT, refusal: null });
  changeProfile.mockReset().mockResolvedValue({ value: KEPT, refusal: null });
  fetchLibraries
    .mockReset()
    .mockResolvedValue([
      aLibrary('films', 'Films', 'movies'),
      aLibrary('tv', 'Television', 'shows'),
      aLibrary('albums', 'Albums', 'music'),
    ]);
});

/**
 * Opens the dialog on a profile, or on a new one.
 */
const open = (profile: QualityProfile | null = null) => {
  const handlers = { onClose: vi.fn(), onSaved: vi.fn() };
  const shown = renderInAnAddress(<ProfileEditor isOpen profile={profile} {...handlers} />);

  return { ...handlers, ...shown };
};

/**
 * Moves to one of the dialog's tabs, since only the one showing is rendered.
 */
const goTo = async (user: ReturnType<typeof userEvent.setup>, tab: string) => {
  await user.click(screen.getByRole('tab', { name: tab }));
};

describe('ProfileEditor', () => {
  it('opens as a dialog over the profiles rather than replacing them', () => {
    open();

    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('adds a video profile, ranking what it takes and sizing each quality, for the libraries chosen', async () => {
    const user = userEvent.setup();
    const { onSaved, onClose } = open();

    await user.type(screen.getByRole('textbox', { name: 'Name' }), 'UHD');
    await user.click(screen.getByRole('checkbox', { name: '2160p' }));
    await user.click(screen.getByRole('button', { name: 'Move 2160p up' }));
    screen.getByRole('slider', { name: 'Largest for WEB-DL 2160p' }).focus();
    await user.keyboard('{ArrowLeft}');

    await goTo(user, 'Matching');

    await user.click(screen.getByRole('button', { name: 'Out on disc' }));
    await user.type(screen.getByRole('textbox', { name: 'Preferred words' }), 'HDR, Atmos');

    await goTo(user, 'Access');

    await user.click(await screen.findByRole('checkbox', { name: /Films/ }));
    await user.click(screen.getByRole('button', { name: 'Add profile' }));

    await waitFor(() => {
      expect(onSaved).toHaveBeenCalledWith(KEPT);
    });
    expect(onClose).toHaveBeenCalled();
    expect(addProfile).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'UHD',
        kind: 'video',
        resolutions: ['1080p', '2160p', '720p'],
        smallestMb: null,
        largestMb: null,
        releaseWait: 'physical',
        preferredWords: ['HDR', 'Atmos'],
        libraryIds: ['films'],
      }),
    );
    expect(screen.queryByRole('checkbox', { name: /Albums/ })).not.toBeInTheDocument();
    expect(addProfile.mock.calls[0]?.[0].sizes).toContainEqual({
      source: 'webdl',
      resolution: '2160p',
      minMb: 1500,
      maxMb: 39_601,
    });
  });

  it('prefers releases in the language chosen, and takes the library’s otherwise', async () => {
    const user = userEvent.setup();

    open();

    await user.type(screen.getByRole('textbox', { name: 'Name' }), 'UHD');

    await goTo(user, 'Matching');

    await user.click(screen.getByRole('button', { name: /Preferred language/ }));
    await user.click(await screen.findByRole('menuitemradio', { name: 'Deutsch' }));
    await user.click(screen.getByRole('button', { name: 'Add profile' }));

    await waitFor(() => {
      expect(addProfile).toHaveBeenCalledWith(expect.objectContaining({ preferredLanguage: 'de' }));
    });
  });

  it('leaves a profile naming no library, which offers it for all of them', async () => {
    const user = userEvent.setup();

    open();

    await user.type(screen.getByRole('textbox', { name: 'Name' }), 'UHD');

    await goTo(user, 'Access');

    expect(await screen.findByRole('checkbox', { name: 'Every library' })).toBeChecked();

    await user.click(screen.getByRole('button', { name: 'Add profile' }));

    await waitFor(() => {
      expect(addProfile).toHaveBeenCalledWith(expect.objectContaining({ libraryIds: [] }));
    });
  });

  it('keeps a profile to the roles and people named on it', async () => {
    const user = userEvent.setup();

    open();

    await user.type(screen.getByRole('textbox', { name: 'Name' }), 'UHD');

    await goTo(user, 'Access');

    await user.click(await screen.findByRole('checkbox', { name: 'Trusted' }));
    await user.click(await screen.findByRole('checkbox', { name: /Dan/ }));
    await user.click(screen.getByRole('button', { name: 'Add profile' }));

    await waitFor(() => {
      expect(addProfile).toHaveBeenCalledWith(
        expect.objectContaining({ roleIds: ['trusted'], accountIds: ['dan'], isDefault: false }),
      );
    });
  });

  it('stops asking who a profile is for once everything goes through it', async () => {
    const user = userEvent.setup();

    open();

    await user.type(screen.getByRole('textbox', { name: 'Name' }), 'UHD');

    await goTo(user, 'Access');

    await user.click(await screen.findByRole('checkbox', { name: 'Trusted' }));
    await user.click(screen.getByRole('switch', { name: 'Always use this profile' }));

    expect(screen.queryByRole('checkbox', { name: 'Trusted' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Add profile' }));

    await waitFor(() => {
      expect(addProfile).toHaveBeenCalledWith(
        expect.objectContaining({ isDefault: true, roleIds: [], accountIds: [] }),
      );
    });
  });

  it('asks a music profile for formats, sizes an album, and offers music libraries', async () => {
    const user = userEvent.setup();

    open();

    await user.click(screen.getByRole('button', { name: 'Music' }));

    expect(screen.getByRole('list', { name: 'Formats' })).toBeInTheDocument();
    expect(screen.queryByRole('list', { name: 'Resolutions' })).not.toBeInTheDocument();
    expect(screen.getByRole('spinbutton', { name: 'Largest (MB an album)' })).toBeInTheDocument();

    await goTo(user, 'Access');

    expect(await screen.findByRole('checkbox', { name: /Albums/ })).toBeInTheDocument();
  });

  it('says there are no libraries of the kind yet', async () => {
    const user = userEvent.setup();

    fetchLibraries.mockResolvedValue([]);

    open();

    await goTo(user, 'Access');

    expect(
      await screen.findByText('There are no film or series libraries yet.'),
    ).toBeInTheDocument();
  });

  it('asks how far to upgrade, from what the profile takes', async () => {
    const user = userEvent.setup();

    open(KEPT);

    await goTo(user, 'Matching');

    await user.click(screen.getByRole('switch', { name: 'Upgrade to a better release later' }));
    await user.click(screen.getByRole('button', { name: 'Until the resolution is' }));
    await user.click(await screen.findByRole('menuitemradio', { name: '1080p' }));
    await user.click(screen.getByRole('button', { name: 'And the source is' }));
    await user.click(await screen.findByRole('menuitemradio', { name: 'The best there is' }));
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(changeProfile).toHaveBeenCalledWith(
        KEPT.id,
        expect.objectContaining({
          isUpgrading: true,
          upgradeUntilResolution: '1080p',
          upgradeUntilSource: null,
          bannedWords: ['cam'],
        }),
      );
    });
  });

  it('asks a music profile how far to upgrade by format', async () => {
    const user = userEvent.setup();

    open({ ...KEPT, kind: 'music', isUpgrading: true });

    await goTo(user, 'Matching');

    await user.click(screen.getByRole('button', { name: 'Until the format is' }));
    await user.click(await screen.findByRole('menuitemradio', { name: 'FLAC' }));
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(changeProfile).toHaveBeenCalledWith(
        KEPT.id,
        expect.objectContaining({ upgradeUntilMusicQuality: 'flac' }),
      );
    });
  });

  it('goes back to the tab holding whatever is wrong, so it is not hidden', async () => {
    const user = userEvent.setup();

    open();

    await goTo(user, 'Access');

    expect(screen.queryByRole('textbox', { name: 'Name' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Add profile' }));

    expect(await screen.findByText('Give the profile a name.')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Name' })).toBeInTheDocument();
  });

  it('says what is wrong, or why it could not be saved', async () => {
    addProfile.mockResolvedValueOnce({ value: null, refusal: { message: 'Requesting is off.' } });
    addProfile.mockResolvedValueOnce({ value: null, refusal: null });

    const user = userEvent.setup();

    open();

    await user.click(screen.getByRole('button', { name: 'Add profile' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Give the profile a name.');

    await user.type(screen.getByRole('textbox', { name: 'Name' }), 'HD');

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Add profile' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Requesting is off.');

    await user.click(screen.getByRole('button', { name: 'Add profile' }));

    expect(await screen.findByText('That could not be saved.')).toBeInTheDocument();
  });

  it('opens afresh on another profile', () => {
    const { rerender, onClose, onSaved } = open(KEPT);

    rerender(
      <ProfileEditor
        isOpen
        profile={{ ...KEPT, id: 'b', name: 'Other' }}
        onClose={onClose}
        onSaved={onSaved}
      />,
    );

    expect(screen.getByRole('textbox', { name: 'Name' })).toHaveValue('Other');
  });

  it('sets a display name so devtools can identify it', () => {
    expect(ProfileEditor.displayName).toBe('ProfileEditor');
  });
});
