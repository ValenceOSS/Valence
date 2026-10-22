import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import { changeProfiles } from '@ValenceClient/profiles/changeProfiles';
import { fetchProfileLibraries } from '@ValenceClient/profiles/fetchProfileLibraries';
import { notify } from '@ValenceUI/notify';
import type { ProfileLibrary } from '@ValenceContracts/schemas/ProfileLibraries';
import type { ViewerProfile } from '@ValenceContracts/schemas/ViewerProfile';
import type * as Notify from '@ValenceUI/notify';
import { DEFAULT_DISCORD_PRESENCE } from '@ValenceContracts/schemas/DiscordPresence';
import { ProfileLimitsDialog } from './ProfileLimitsDialog';
import { PLUS_JAKARTA_SANS_AS_STORED } from '@ValenceContracts/schemas/LetterFont';

vi.mock('@ValenceClient/profiles/changeProfiles', () => ({ changeProfiles: vi.fn() }));

vi.mock('@ValenceClient/profiles/fetchProfileLibraries', () => ({
  fetchProfileLibraries: vi.fn(),
}));

vi.mock('@ValenceUI/notify', async (importOriginal) => {
  const original = await importOriginal<typeof Notify>();

  return { ...original, notify: { ...original.notify, failed: vi.fn() } };
});

const changed = vi.mocked(changeProfiles);

const shelves = vi.mocked(fetchProfileLibraries);

const KID: ViewerProfile = {
  id: '00000000-0000-4000-8000-000000000003',
  name: 'Kid',
  colour: '#3a8ee8',
  avatar: { kind: 'initial', font: PLUS_JAKARTA_SANS_AS_STORED },
  askStillWatchingAfter: 4,
  showsWhatIamWatching: false,
  discordPresence: DEFAULT_DISCORD_PRESENCE,
  prefersBestCopy: false,
  isOwner: false,
  hasPin: false,
  mayRequest: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const aShelf = (overrides: Partial<ProfileLibrary> = {}): ProfileLibrary => ({
  id: 'films',
  name: 'Films',
  mayView: true,
  maximumAge: null,
  allowsUnrated: false,
  accountMaximumAge: null,
  ...overrides,
});

const draw = (profile: ViewerProfile | null = KID, accountId?: string) => {
  const onClose = vi.fn();

  renderInAnAddress(
    accountId === undefined ? (
      <ProfileLimitsDialog profile={profile} onClose={onClose} />
    ) : (
      <ProfileLimitsDialog profile={profile} accountId={accountId} onClose={onClose} />
    ),
  );

  return { onClose, actor: userEvent.setup() };
};

beforeEach(() => {
  changed.mockReset().mockResolvedValue(null);
  shelves.mockReset().mockResolvedValue([aShelf()]);
  vi.mocked(notify.failed).mockReset();
});

describe('ProfileLimitsDialog', () => {
  it('says whose limits these are, and that the account’s own still apply', async () => {
    draw();

    expect(await screen.findByRole('dialog', { name: 'What Kid can watch' })).toBeInTheDocument();
    expect(
      screen.getByText('Anything the whole account is limited from stays limited here too.'),
    ).toBeInTheDocument();
  });

  it('lists every library the account reaches', async () => {
    shelves.mockResolvedValue([aShelf(), aShelf({ id: 'shows', name: 'Shows', mayView: false })]);

    draw();

    expect(await screen.findByRole('button', { name: 'Hide Films from Kid' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: 'Give Kid access to Shows' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('says so where there are no libraries yet', async () => {
    shelves.mockResolvedValue([]);

    draw();

    expect(await screen.findByText('There are no libraries yet.')).toBeInTheDocument();
  });

  it('hides a library from the profile', async () => {
    const { actor } = draw();

    await actor.click(await screen.findByRole('button', { name: 'Hide Films from Kid' }));

    await waitFor(() => {
      expect(changed).toHaveBeenCalledWith({
        path: `/${KID.id}/libraries/films`,
        method: 'DELETE',
      });
    });
  });

  it('gives the profile a library back', async () => {
    shelves.mockResolvedValue([aShelf({ mayView: false })]);

    const { actor } = draw();

    await actor.click(await screen.findByRole('button', { name: 'Give Kid access to Films' }));

    await waitFor(() => {
      expect(changed).toHaveBeenCalledWith({
        path: `/${KID.id}/libraries/films`,
        method: 'PUT',
      });
    });
  });

  it('offers no age limit on a library the profile cannot see', async () => {
    shelves.mockResolvedValue([aShelf({ mayView: false })]);

    draw();

    await screen.findByRole('button', { name: 'Give Kid access to Films' });

    expect(
      screen.queryByRole('button', { name: /Age rating limit in Films for Kid/ }),
    ).not.toBeInTheDocument();
  });

  it('holds the profile to an age in a library', async () => {
    const { actor } = draw();

    await actor.click(
      await screen.findByRole('button', { name: /Age rating limit in Films for Kid/ }),
    );
    await actor.click(await screen.findByRole('menuitemradio', { name: /Up to 12/ }));

    await waitFor(() => {
      expect(changed).toHaveBeenCalledWith({
        path: `/${KID.id}/libraries/films/ceiling`,
        method: 'PUT',
        body: { maximumAge: 12, allowsUnrated: false },
      });
    });
  });

  it('lets go of an age limit', async () => {
    shelves.mockResolvedValue([aShelf({ maximumAge: 12 })]);

    const { actor } = draw();

    await actor.click(
      await screen.findByRole('button', { name: /Age rating limit in Films for Kid/ }),
    );
    await actor.click(await screen.findByRole('menuitemradio', { name: /No age limit/ }));

    await waitFor(() => {
      expect(changed).toHaveBeenCalledWith({
        path: `/${KID.id}/libraries/films/ceiling`,
        method: 'DELETE',
      });
    });
  });

  it('offers only the ages at or below the account’s own', async () => {
    shelves.mockResolvedValue([aShelf({ accountMaximumAge: 12 })]);

    const { actor } = draw();

    await actor.click(
      await screen.findByRole('button', { name: /Age rating limit in Films for Kid/ }),
    );

    expect(await screen.findByRole('menuitemradio', { name: /Up to 12/ })).toBeInTheDocument();
    expect(screen.queryByRole('menuitemradio', { name: /Up to 15/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('menuitemradio', { name: /Up to 18/ })).not.toBeInTheDocument();
  });

  it('offers unrated titles only under an age limit, and turns them on', async () => {
    shelves.mockResolvedValue([
      aShelf({ maximumAge: 12 }),
      aShelf({ id: 'shows', name: 'Shows', maximumAge: null }),
    ]);

    const { actor } = draw();

    await actor.click(
      await screen.findByRole('button', { name: 'Allow unrated titles in Films for Kid' }),
    );

    expect(
      screen.queryByRole('button', { name: 'Allow unrated titles in Shows for Kid' }),
    ).not.toBeInTheDocument();

    await waitFor(() => {
      expect(changed).toHaveBeenCalledWith({
        path: `/${KID.id}/libraries/films/ceiling`,
        method: 'PUT',
        body: { maximumAge: 12, allowsUnrated: true },
      });
    });
  });

  it('says why a change was refused', async () => {
    changed.mockResolvedValue('That library is not on this account.');

    const { actor } = draw();

    await actor.click(await screen.findByRole('button', { name: 'Hide Films from Kid' }));

    await waitFor(() => {
      expect(notify.failed).toHaveBeenCalledWith('That library is not on this account.');
    });
  });

  it('changes another account’s profile for an administrator', async () => {
    const { actor } = draw(KID, 'account-7');

    await actor.click(await screen.findByRole('button', { name: 'Hide Films from Kid' }));

    await waitFor(() => {
      expect(changed).toHaveBeenCalledWith({
        path: `/${KID.id}/libraries/films`,
        method: 'DELETE',
        accountId: 'account-7',
      });
    });
    expect(shelves).toHaveBeenCalledWith(KID.id, 'account-7');
  });

  it('reads nothing and draws nothing while it is shut', () => {
    draw(null);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(shelves).not.toHaveBeenCalled();
  });

  it('closes on Done', async () => {
    const { onClose, actor } = draw();

    const dialog = await screen.findByRole('dialog', { name: 'What Kid can watch' });

    await actor.click(within(dialog).getByRole('button', { name: 'Done' }));

    expect(onClose).toHaveBeenCalled();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(ProfileLimitsDialog.displayName).toBe('ProfileLimitsDialog');
  });
});
