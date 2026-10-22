import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import { changeProfiles } from '@ValenceClient/profiles/changeProfiles';
import { fetchProfileList } from '@ValenceClient/profiles/fetchProfileList';
import { fetchProfileLibraries } from '@ValenceClient/profiles/fetchProfileLibraries';
import { notify } from '@ValenceUI/notify';
import { PROFILE_COLOURS } from '@ValenceContracts/schemas/ViewerProfile';
import type { ViewerProfile } from '@ValenceContracts/schemas/ViewerProfile';
import type * as Notify from '@ValenceUI/notify';
import { DEFAULT_DISCORD_PRESENCE } from '@ValenceContracts/schemas/DiscordPresence';
import { HouseholdProfiles } from './HouseholdProfiles';
import { PLUS_JAKARTA_SANS_AS_STORED } from '@ValenceContracts/schemas/LetterFont';

vi.mock('@ValenceClient/profiles/changeProfiles', () => ({ changeProfiles: vi.fn() }));

vi.mock('@ValenceClient/profiles/fetchProfileList', () => ({ fetchProfileList: vi.fn() }));

vi.mock('@ValenceClient/household/fetchHousehold', () => ({
  fetchOnboarding: () =>
    Promise.resolve({
      isOnboarded: true,
      household: {
        name: 'Dan',
        colour: '#3a8ee8',
        avatar: { kind: 'initial', font: PLUS_JAKARTA_SANS_AS_STORED },
        updatedAt: '2026-01-01T00:00:00.000Z',
        hasOwnName: false,
        hasOwnPicture: false,
      },
    }),
  saveHousehold: vi.fn(),
  uploadHouseholdPhoto: vi.fn(),
}));

vi.mock('@ValenceClient/profiles/fetchProfileLibraries', () => ({
  fetchProfileLibraries: vi.fn(),
}));

vi.mock('@ValenceUI/notify', async (importOriginal) => {
  const original = await importOriginal<typeof Notify>();

  return { ...original, notify: { ...original.notify, failed: vi.fn() } };
});

const changed = vi.mocked(changeProfiles);

const listed = vi.mocked(fetchProfileList);

const aProfile = (
  at: number,
  name: string,
  overrides: Partial<ViewerProfile> = {},
): ViewerProfile => ({
  id: `00000000-0000-4000-8000-${at.toString().padStart(12, '0')}`,
  name,
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
  ...overrides,
});

const DAN = aProfile(1, 'Dan', { isOwner: true, hasPin: true });

const SAM = aProfile(2, 'Sam', { colour: '#e8503a' });

const KID = aProfile(3, 'Kid', { hasPin: true, mayRequest: false });

const holding = (profiles: ViewerProfile[]) => {
  listed.mockResolvedValue({ profiles, chosenProfileId: DAN.id });
};

const draw = (accountId?: string) => {
  renderInAnAddress(
    accountId === undefined ? <HouseholdProfiles /> : <HouseholdProfiles accountId={accountId} />,
  );

  return userEvent.setup();
};

const openTheMenuOf = async (actor: ReturnType<typeof userEvent.setup>, name: string) => {
  await actor.click(await screen.findByRole('button', { name: `Change ${name}` }));
};

const offered = () => screen.getAllByRole('menuitem').map((item) => item.textContent);

beforeEach(() => {
  changed.mockReset().mockResolvedValue(null);
  listed.mockReset();
  holding([DAN, SAM, KID]);
  vi.mocked(fetchProfileLibraries).mockReset().mockResolvedValue([]);
  vi.mocked(notify.failed).mockReset();
});

describe('HouseholdProfiles', () => {
  it('offers the owner a name and picture for the account once more than one person watches', async () => {
    draw();

    expect(await screen.findByRole('textbox', { name: 'Name' })).toHaveAttribute(
      'placeholder',
      'Dan',
    );
  });

  it('offers no account name or picture where one person watches, since the account is them', async () => {
    holding([DAN]);
    draw();

    await screen.findByText('Dan');

    expect(screen.queryByRole('textbox', { name: 'Name' })).not.toBeInTheDocument();
  });

  it('offers no account name or picture to an administrator managing somebody else', async () => {
    draw('somebody');

    await screen.findByText('Dan');

    expect(screen.queryByRole('textbox', { name: 'Name' })).not.toBeInTheDocument();
  });

  it('lists every profile on the account', async () => {
    draw();

    expect(await screen.findByText('Dan')).toBeInTheDocument();
    expect(screen.getByText('Sam')).toBeInTheDocument();
    expect(screen.getByText('Kid')).toBeInTheDocument();
  });

  it('marks the owner, the profiles with a PIN, and those that may not ask for things', async () => {
    draw();

    const [dan, sam, kid] = await screen.findAllByRole('listitem');

    expect(dan).toHaveTextContent('Owner');
    expect(dan).toHaveTextContent('PIN');
    expect(sam).not.toHaveTextContent('PIN');
    expect(sam).not.toHaveTextContent('No requests');
    expect(kid).toHaveTextContent('No requests');
  });

  it('tells the owner what profiles are for', async () => {
    draw();

    expect(await screen.findByRole('button', { name: 'About Profiles' })).toBeInTheDocument();
  });

  it('says so where the profiles could not be read', async () => {
    listed.mockRejectedValue(new Error('offline'));

    draw();

    expect(
      await screen.findByText(/The profiles on this account couldn’t be read\./),
    ).toBeInTheDocument();
  });

  describe('the owner’s own profile', () => {
    it('can be renamed and given a PIN, but neither limited, removed nor handed on', async () => {
      const actor = draw();

      await openTheMenuOf(actor, 'Dan');

      expect(offered()).toEqual(['Rename', 'Change the PIN', 'Remove the PIN']);
    });
  });

  describe('anybody else’s profile', () => {
    it('can also be stopped from asking, limited, made the owner and removed', async () => {
      const actor = draw();

      await openTheMenuOf(actor, 'Sam');

      expect(offered()).toEqual([
        'Rename',
        'Set a PIN',
        'Stop requests',
        'Libraries and ages',
        'Make owner',
        'Remove',
      ]);
    });

    it('offers to allow requests again where they were stopped', async () => {
      const actor = draw();

      await openTheMenuOf(actor, 'Kid');

      expect(offered()).toContain('Allow requests');
      expect(offered()).not.toContain('Stop requests');
    });
  });

  it('stops a profile asking for things, once the owner says so', async () => {
    const actor = draw();

    await openTheMenuOf(actor, 'Sam');
    await actor.click(screen.getByRole('menuitem', { name: 'Stop requests' }));

    const asked = await screen.findByRole('dialog', { name: 'Stop Sam requesting?' });

    expect(changed).not.toHaveBeenCalled();

    await actor.click(within(asked).getByRole('button', { name: 'Stop requests' }));

    await waitFor(() => {
      expect(changed).toHaveBeenCalledWith({
        path: `/${SAM.id}/may-request`,
        method: 'PUT',
        body: { mayRequest: false },
      });
    });
  });

  it('lets a profile ask for things again', async () => {
    const actor = draw();

    await openTheMenuOf(actor, 'Kid');
    await actor.click(screen.getByRole('menuitem', { name: 'Allow requests' }));

    await waitFor(() => {
      expect(changed).toHaveBeenCalledWith({
        path: `/${KID.id}/may-request`,
        method: 'PUT',
        body: { mayRequest: true },
      });
    });
  });

  it('takes a PIN away, once the owner says so', async () => {
    const actor = draw();

    await openTheMenuOf(actor, 'Kid');
    await actor.click(screen.getByRole('menuitem', { name: 'Remove the PIN' }));

    const asked = await screen.findByRole('dialog', { name: 'Remove Kid’s PIN?' });

    expect(changed).not.toHaveBeenCalled();

    await actor.click(within(asked).getByRole('button', { name: 'Remove the PIN' }));

    await waitFor(() => {
      expect(changed).toHaveBeenCalledWith({
        path: `/${KID.id}/pin`,
        method: 'PUT',
        body: { pin: null },
      });
    });
  });

  it('renames a profile, keeping its colour', async () => {
    const actor = draw();

    await openTheMenuOf(actor, 'Sam');
    await actor.click(screen.getByRole('menuitem', { name: 'Rename' }));

    const dialog = await screen.findByRole('dialog', { name: 'Rename Sam' });
    const field = within(dialog).getByLabelText('Name');

    await actor.clear(field);
    await actor.type(field, 'Samantha');
    await actor.click(within(dialog).getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(changed).toHaveBeenCalledWith({
        path: `/${SAM.id}`,
        method: 'PATCH',
        body: { name: 'Samantha', colour: SAM.colour },
      });
    });
  });

  it('gives a profile a PIN', async () => {
    const actor = draw();

    await openTheMenuOf(actor, 'Sam');
    await actor.click(screen.getByRole('menuitem', { name: 'Set a PIN' }));

    const dialog = await screen.findByRole('dialog', { name: 'PIN for Sam' });

    await actor.type(within(dialog).getByLabelText('New PIN'), '4321');
    await actor.type(within(dialog).getByLabelText('Type the PIN again'), '4321');
    await actor.click(within(dialog).getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(changed).toHaveBeenCalledWith({
        path: `/${SAM.id}/pin`,
        method: 'PUT',
        body: { pin: '4321' },
      });
    });
  });

  it('opens what a profile can watch', async () => {
    const actor = draw();

    await openTheMenuOf(actor, 'Sam');
    await actor.click(screen.getByRole('menuitem', { name: 'Libraries and ages' }));

    expect(await screen.findByRole('dialog', { name: 'What Sam can watch' })).toBeInTheDocument();
    expect(fetchProfileLibraries).toHaveBeenCalledWith(SAM.id, undefined);
  });

  it('removes a profile only once it is confirmed', async () => {
    const actor = draw();

    await openTheMenuOf(actor, 'Sam');
    await actor.click(screen.getByRole('menuitem', { name: 'Remove' }));

    const dialog = await screen.findByRole('dialog', { name: 'Remove Sam?' });

    expect(changed).not.toHaveBeenCalled();

    await actor.click(within(dialog).getByRole('button', { name: 'Remove' }));

    await waitFor(() => {
      expect(changed).toHaveBeenCalledWith({ path: `/${SAM.id}`, method: 'DELETE' });
    });
  });

  it('hands the account to another profile only once it is confirmed', async () => {
    const actor = draw();

    await openTheMenuOf(actor, 'Sam');
    await actor.click(screen.getByRole('menuitem', { name: 'Make owner' }));

    const dialog = await screen.findByRole('dialog', { name: 'Make Sam the owner?' });

    expect(changed).not.toHaveBeenCalled();

    await actor.click(within(dialog).getByRole('button', { name: 'Make owner' }));

    await waitFor(() => {
      expect(changed).toHaveBeenCalledWith({ path: `/${SAM.id}/owner`, method: 'POST' });
    });
  });

  it('adds a profile in the next colour along', async () => {
    const actor = draw();

    await actor.type(await screen.findByRole('textbox', { name: 'Add a profile' }), '  Mum  ');
    await actor.click(screen.getByRole('button', { name: 'Add' }));

    await waitFor(() => {
      expect(changed).toHaveBeenCalledWith({
        path: '',
        method: 'POST',
        body: { name: 'Mum', colour: PROFILE_COLOURS[3] },
      });
    });
    await waitFor(() => {
      expect(screen.getByRole('textbox', { name: 'Add a profile' })).toHaveValue('');
    });
  });

  it('will not add a profile with no name', async () => {
    draw();

    await screen.findByRole('textbox', { name: 'Add a profile' });

    expect(screen.getByRole('button', { name: 'Add' })).toBeDisabled();
  });

  it('keeps the name typed and says why where a profile could not be added', async () => {
    changed.mockResolvedValue('An account can hold 6 profiles.');

    const actor = draw();

    await actor.type(await screen.findByRole('textbox', { name: 'Add a profile' }), 'Mum');
    await actor.click(screen.getByRole('button', { name: 'Add' }));

    await waitFor(() => {
      expect(notify.failed).toHaveBeenCalledWith('An account can hold 6 profiles.');
    });
    expect(screen.getByRole('textbox', { name: 'Add a profile' })).toHaveValue('Mum');
  });

  it('offers no more once the account holds six', async () => {
    holding([DAN, SAM, KID, aProfile(4, 'Four'), aProfile(5, 'Five'), aProfile(6, 'Six')]);

    draw();

    expect(await screen.findByText('An account can hold 6 profiles.')).toBeInTheDocument();
    expect(screen.queryByRole('textbox', { name: 'Add a profile' })).not.toBeInTheDocument();
  });

  describe('for an administrator managing somebody else’s account', () => {
    const ACCOUNT = 'account-7';

    it('reads that account’s profiles, and says changes apply at once', async () => {
      const actor = draw(ACCOUNT);

      await actor.hover(await screen.findByRole('button', { name: 'About Profiles' }));

      expect(
        await screen.findByText(/The profiles on this account\. Changes here apply at once/),
      ).toBeInTheDocument();
      expect(listed).toHaveBeenCalledWith(ACCOUNT);
    });

    it('changes that account’s profiles, not their own', async () => {
      const actor = draw(ACCOUNT);

      await openTheMenuOf(actor, 'Sam');
      await actor.click(screen.getByRole('menuitem', { name: 'Stop requests' }));
      await actor.click(
        within(await screen.findByRole('dialog', { name: 'Stop Sam requesting?' })).getByRole(
          'button',
          { name: 'Stop requests' },
        ),
      );

      await waitFor(() => {
        expect(changed).toHaveBeenCalledWith({
          path: `/${SAM.id}/may-request`,
          method: 'PUT',
          body: { mayRequest: false },
          accountId: ACCOUNT,
        });
      });
    });

    it('opens what one of them can watch on that account', async () => {
      const actor = draw(ACCOUNT);

      await openTheMenuOf(actor, 'Sam');
      await actor.click(screen.getByRole('menuitem', { name: 'Libraries and ages' }));

      await screen.findByRole('dialog', { name: 'What Sam can watch' });

      await waitFor(() => {
        expect(fetchProfileLibraries).toHaveBeenCalledWith(SAM.id, ACCOUNT);
      });
    });
  });

  it('sets a display name so devtools can identify it', () => {
    expect(HouseholdProfiles.displayName).toBe('HouseholdProfiles');
  });
});
