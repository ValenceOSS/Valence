import { screen, waitFor, within } from '@testing-library/react';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { somePluginContributions } from '@ValenceClient/testing/somePluginContributions';
import type { Account } from '@ValenceClient/admin/fetchAccounts';
import type { Role } from '@ValenceContracts/schemas/Permission';
import type { StreamLimit } from '@ValenceContracts/schemas/StreamLimit';
import { RolesPanel } from './RolesPanel';

const mocks = vi.hoisted(() => ({
  fetchPermissionCatalogue: vi.fn(),
  fetchRoles: vi.fn(),
  orderRoles: vi.fn(),
  createRole: vi.fn(),
  updateRole: vi.fn(),
  deleteRole: vi.fn(),
  assignRole: vi.fn(),
  removeRole: vi.fn(),
}));

const limits = vi.hoisted(() => ({
  roleStreamLimit: vi.fn(),
  saveRoleStreamLimit: vi.fn(),
}));

vi.mock('@ValenceClient/admin/fetchRoles', () => mocks);

const accountMocks = vi.hoisted(() => ({ fetchAccounts: vi.fn<() => Promise<Account[]>>() }));

vi.mock('@ValenceClient/admin/fetchAccounts', () => accountMocks);

vi.mock('@ValenceClient/admin/roleStreamLimit', () => ({
  roleStreamLimit: limits.roleStreamLimit,
}));

vi.mock('@ValenceClient/admin/saveRoleStreamLimit', () => ({
  saveRoleStreamLimit: limits.saveRoleStreamLimit,
}));

vi.mock('@ValenceClient/plugins/fetchPluginContributions', () => ({
  fetchPluginContributions: () => Promise.resolve(somePluginContributions()),
}));

vi.mock('@ValenceClient/session/fetchMyPermissions', () => ({
  fetchMyPermissions: () => Promise.resolve({ permissions: [], isAdministrator: true }),
}));

vi.mock('@ValenceClient/requests/fetchRequests', () => ({
  fetchRequestsAvailability: () => Promise.resolve({ isEnabled: false, kinds: [] }),
}));

const anAccount = (id: string, name: string, roles: string[]): Account => ({
  id,
  name,
  username: name.toLowerCase(),
  discordId: null,
  email: null,
  canSignIn: true,
  lastSignedInAt: null,
  setup: { state: 'none', expiresAt: null },
  createdAt: '',
  isBanned: false,
  banReason: null,
  position: 100,
  isAdministrator: false,
  face: null,
  roles,
});

const FREE: StreamLimit = {
  maxBitrateKbps: null,
  maxStreams: null,
  maxQuality: null,
  limitsDownloads: false,
};

const ADMINISTRATOR: Role = {
  id: 'role_1',
  name: 'Administrator',
  position: 300,
  color: null,
  permissions: ['administrator'],
};

const MODERATOR: Role = {
  id: 'role_3',
  name: 'Moderator',
  position: 200,
  color: '#22aa44',
  permissions: ['jobs.run'],
};

const MEMBER: Role = {
  id: 'role_2',
  name: 'Member',
  position: 100,
  color: null,
  permissions: ['sharing.link'],
};

const HOUSEMATE: Role = {
  id: 'role_9',
  name: 'Housemate',
  position: 0,
  color: null,
  permissions: [],
};

const ROLES = [ADMINISTRATOR, MODERATOR, MEMBER];

const REFUSED = { message: 'That role is equal to or higher than yours.' };

/**
 * Waits for the role open beside the list to be the one named.
 *
 * @param name - The role's name.
 */
const waitForOpen = async (name: string) => {
  expect(await screen.findByRole('form', { name: `Edit ${name}` })).toBeInTheDocument();
};

/**
 * Picks a role from the list, the way a person does: by pressing it.
 *
 * @param user - Who is pressing.
 * @param name - The role's name.
 */
const choose = async (user: ReturnType<typeof userEvent.setup>, name: string) => {
  await user.click(await screen.findByRole('button', { name: new RegExp(`^${name}`) }));
};

/**
 * Opens one role's menu and picks something from it.
 *
 * @param user - Who is pressing.
 * @param name - The role's name.
 * @param item - What to pick.
 */
const pickFromMenu = async (
  user: ReturnType<typeof userEvent.setup>,
  name: string,
  item: RegExp,
) => {
  await user.click(await screen.findByRole('button', { name: `Actions for ${name}` }));
  await user.click(await screen.findByRole('menuitem', { name: item }));
};

beforeEach(() => {
  for (const mock of [...Object.values(mocks), ...Object.values(limits)]) {
    mock.mockReset();
  }

  mocks.fetchPermissionCatalogue.mockResolvedValue([
    'administrator',
    'jobs.run',
    'jobs.runDestructive',
    'sharing.link',
  ]);
  mocks.fetchRoles.mockResolvedValue({ roles: ROLES, outOfReach: [] });
  mocks.orderRoles.mockResolvedValue(null);
  mocks.createRole.mockResolvedValue({ role: HOUSEMATE, refusal: null });
  mocks.updateRole.mockResolvedValue(null);
  mocks.deleteRole.mockResolvedValue(null);
  mocks.assignRole.mockResolvedValue(null);
  mocks.removeRole.mockResolvedValue(null);
  limits.roleStreamLimit.mockResolvedValue(FREE);
  limits.saveRoleStreamLimit.mockResolvedValue(FREE);
  accountMocks.fetchAccounts
    .mockReset()
    .mockResolvedValue([
      anAccount('ada', 'Ada', ['Member']),
      anAccount('bo', 'Bo', ['Member', 'Administrator']),
    ]);
});

describe('RolesPanel', () => {
  it('says there are no roles only once they have been read', async () => {
    mocks.fetchRoles.mockReturnValue(new Promise(() => {}));

    renderInAnAddress(<RolesPanel />);

    expect(await screen.findByLabelText('Loading')).toBeInTheDocument();
    expect(screen.queryByText('No roles yet.')).not.toBeInTheDocument();
  });

  it('says there are no roles where the server has none', async () => {
    mocks.fetchRoles.mockResolvedValue({ roles: [], outOfReach: [] });

    renderInAnAddress(<RolesPanel />);

    expect(await screen.findByText('No roles yet.')).toBeInTheDocument();
  });

  it('says the roles could not be read, and offers to try again', async () => {
    mocks.fetchRoles.mockRejectedValue(new Error('The server did not answer.'));

    renderInAnAddress(<RolesPanel />);

    expect(await screen.findByRole('alert')).toHaveTextContent('Couldn’t load the roles.');
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });

  it('says the roles could not be read where the permissions could not be', async () => {
    mocks.fetchPermissionCatalogue.mockRejectedValue(new Error('The server did not answer.'));

    renderInAnAddress(<RolesPanel />);

    expect(await screen.findByRole('alert')).toHaveTextContent('Couldn’t load the roles.');
  });

  it('lists the roles highest first, each with how many hold it', async () => {
    renderInAnAddress(<RolesPanel />);

    await screen.findByText('2 members');

    const items = within(screen.getByRole('list', { name: 'Roles, highest first' })).getAllByRole(
      'listitem',
    );

    expect(items).toHaveLength(3);
    expect(items[0]).toHaveTextContent(/Administrator.*1 member/);
    expect(items[1]).toHaveTextContent(/Moderator.*0 members/);
    expect(items[2]).toHaveTextContent(/Member.*2 members/);
  });

  it('opens the highest role the reader may change', async () => {
    renderInAnAddress(<RolesPanel />);

    await waitForOpen('Administrator');

    expect(screen.getByRole('textbox', { name: 'Name' })).toHaveValue('Administrator');
  });

  it('passes over roles out of reach when choosing which to open', async () => {
    mocks.fetchRoles.mockResolvedValue({ roles: ROLES, outOfReach: [ADMINISTRATOR.id] });

    renderInAnAddress(<RolesPanel />);

    await waitForOpen('Moderator');
  });

  it('opens the role that was chosen', async () => {
    const user = userEvent.setup();
    renderInAnAddress(<RolesPanel />);

    await waitForOpen('Administrator');
    await choose(user, 'Member');
    await waitForOpen('Member');

    expect(screen.getByRole('textbox', { name: 'Name' })).toHaveValue('Member');
    expect(screen.getByRole('button', { name: /^Member/ })).toHaveAttribute('aria-current', 'true');
  });

  describe('saving a role', () => {
    it('shows the save bar once something changes, and sends only what changed', async () => {
      const user = userEvent.setup();
      renderInAnAddress(<RolesPanel />);

      await choose(user, 'Member');
      await waitForOpen('Member');

      expect(screen.queryByRole('button', { name: 'Save changes' })).not.toBeInTheDocument();

      await user.type(screen.getByRole('textbox', { name: 'Name' }), 's');

      expect(screen.getByRole('status')).toHaveTextContent('You have unsaved changes');

      await user.click(screen.getByRole('button', { name: 'Save changes' }));

      await waitFor(() => {
        expect(mocks.updateRole).toHaveBeenCalledWith(MEMBER.id, { name: 'Members' });
      });
      expect(mocks.assignRole).not.toHaveBeenCalled();
      expect(mocks.removeRole).not.toHaveBeenCalled();
      expect(limits.saveRoleStreamLimit).not.toHaveBeenCalled();
    });

    it('adds a permission the role did not have, once the change is saved', async () => {
      const user = userEvent.setup();
      renderInAnAddress(<RolesPanel />);

      await choose(user, 'Member');
      await waitForOpen('Member');
      await user.click(screen.getByRole('switch', { name: 'Run and schedule jobs' }));

      expect(mocks.updateRole).not.toHaveBeenCalled();

      await user.click(screen.getByRole('button', { name: 'Save changes' }));

      await waitFor(() => {
        expect(mocks.updateRole).toHaveBeenCalledWith(MEMBER.id, {
          permissions: ['sharing.link', 'jobs.run'],
        });
      });
    });

    it('gives the role to somebody and sets its limit without touching the rest', async () => {
      const user = userEvent.setup();
      renderInAnAddress(<RolesPanel />);

      await choose(user, 'Moderator');
      await waitForOpen('Moderator');
      await screen.findByText('2 members');
      await user.click(screen.getByRole('tab', { name: 'Members (0)' }));
      await user.click(screen.getByRole('switch', { name: 'Ada has this role' }));
      await user.click(screen.getByRole('tab', { name: 'Streaming' }));
      await user.click(screen.getByRole('button', { name: 'Highest bitrate' }));
      await user.click(await screen.findByRole('menuitemradio', { name: '10 Mbps' }));
      await user.click(screen.getByRole('button', { name: 'Save changes' }));

      await waitFor(() => {
        expect(limits.saveRoleStreamLimit).toHaveBeenCalledWith(MODERATOR.id, {
          maxBitrateKbps: 10_000,
          maxStreams: null,
          maxQuality: null,
          limitsDownloads: false,
        });
      });
      expect(mocks.assignRole).toHaveBeenCalledWith('ada', MODERATOR.id);
      expect(mocks.updateRole).not.toHaveBeenCalled();
      expect(mocks.removeRole).not.toHaveBeenCalled();
    });

    it('reads the roles again once a save lands', async () => {
      const user = userEvent.setup();
      renderInAnAddress(<RolesPanel />);

      await waitForOpen('Administrator');
      await user.type(screen.getByRole('textbox', { name: 'Name' }), 's');
      await user.click(screen.getByRole('button', { name: 'Save changes' }));

      await waitFor(() => {
        expect(mocks.fetchRoles).toHaveBeenCalledTimes(2);
      });
    });

    it('says why the server refused, keeping what was typed', async () => {
      mocks.updateRole.mockResolvedValue(REFUSED);

      const user = userEvent.setup();
      renderInAnAddress(<RolesPanel />);

      await choose(user, 'Member');
      await waitForOpen('Member');
      await user.type(screen.getByRole('textbox', { name: 'Name' }), 's');
      await user.click(screen.getByRole('button', { name: 'Save changes' }));

      await waitFor(() => {
        expect(screen.getByRole('status')).toHaveTextContent('equal to or higher than yours');
      });
      expect(screen.getByRole('textbox', { name: 'Name' })).toHaveValue('Members');
    });

    it('drops every change on Reset', async () => {
      const user = userEvent.setup();
      renderInAnAddress(<RolesPanel />);

      await choose(user, 'Member');
      await waitForOpen('Member');
      await user.type(screen.getByRole('textbox', { name: 'Name' }), 's');
      await user.click(screen.getByRole('button', { name: 'Reset' }));

      expect(screen.getByRole('textbox', { name: 'Name' })).toHaveValue('Member');
      await waitFor(() => {
        expect(screen.queryByRole('button', { name: 'Save changes' })).not.toBeInTheDocument();
      });

      await choose(user, 'Moderator');

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      await waitForOpen('Moderator');
    });
  });

  describe('switching roles with changes unsaved', () => {
    it('asks before throwing the changes away', async () => {
      const user = userEvent.setup();
      renderInAnAddress(<RolesPanel />);

      await choose(user, 'Member');
      await waitForOpen('Member');
      await user.type(screen.getByRole('textbox', { name: 'Name' }), 's');
      await choose(user, 'Moderator');

      const asking = await screen.findByRole('dialog', { name: 'Discard changes?' });

      expect(asking).toHaveTextContent('Your changes to Members haven’t been saved.');
    });

    it('stays on the role with its changes where the person cancels', async () => {
      const user = userEvent.setup();
      renderInAnAddress(<RolesPanel />);

      await choose(user, 'Member');
      await waitForOpen('Member');
      await user.type(screen.getByRole('textbox', { name: 'Name' }), 's');
      await choose(user, 'Moderator');
      await user.click(
        within(await screen.findByRole('dialog', { name: 'Discard changes?' })).getByRole(
          'button',
          { name: 'Cancel' },
        ),
      );

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
      expect(screen.getByRole('form', { name: 'Edit Member' })).toBeInTheDocument();
      expect(screen.getByRole('textbox', { name: 'Name' })).toHaveValue('Members');
    });

    it('opens the other role, the changes gone, where the person discards', async () => {
      const user = userEvent.setup();
      renderInAnAddress(<RolesPanel />);

      await choose(user, 'Member');
      await waitForOpen('Member');
      await user.type(screen.getByRole('textbox', { name: 'Name' }), 's');
      await choose(user, 'Moderator');
      await user.click(
        within(await screen.findByRole('dialog', { name: 'Discard changes?' })).getByRole(
          'button',
          { name: 'Discard' },
        ),
      );

      await waitForOpen('Moderator');

      expect(screen.getByRole('textbox', { name: 'Name' })).toHaveValue('Moderator');
      expect(mocks.updateRole).not.toHaveBeenCalled();
    });
  });

  describe('creating a role', () => {
    it('opens an unsaved New role at the foot of the list', async () => {
      const user = userEvent.setup();
      renderInAnAddress(<RolesPanel />);

      await waitForOpen('Administrator');
      await user.click(screen.getByRole('button', { name: 'Create role' }));

      expect(await screen.findByRole('form', { name: 'Create a role' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'New role' })).toHaveAttribute(
        'aria-current',
        'true',
      );
      expect(screen.getByRole('status')).toHaveTextContent('This role isn’t saved yet');

      await user.type(screen.getByRole('textbox', { name: 'Name' }), 'Housemate');

      expect(screen.getByRole('button', { name: 'Housemate' })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'New role' })).not.toBeInTheDocument();
    });

    it('makes the role, then gives it its members and limit, and opens it', async () => {
      const user = userEvent.setup();
      renderInAnAddress(<RolesPanel />);

      await waitForOpen('Administrator');
      await screen.findByText('2 members');
      await user.click(screen.getByRole('button', { name: 'Create role' }));

      const making = await screen.findByRole('form', { name: 'Create a role' });

      await user.type(within(making).getByRole('textbox', { name: 'Name' }), 'Housemate');
      await user.click(within(making).getByRole('tab', { name: 'Members (0)' }));
      await user.click(screen.getByRole('switch', { name: 'Bo has this role' }));
      await user.click(within(making).getByRole('tab', { name: 'Streaming' }));
      await user.click(screen.getByRole('button', { name: 'Streams at once' }));
      await user.click(await screen.findByRole('menuitemradio', { name: '1' }));

      mocks.fetchRoles.mockResolvedValue({ roles: [...ROLES, HOUSEMATE], outOfReach: [] });

      await user.click(within(making).getByRole('button', { name: 'Create role' }));

      await waitForOpen('Housemate');

      expect(mocks.createRole).toHaveBeenCalledWith({
        name: 'Housemate',
        color: null,
        permissions: [],
      });
      expect(mocks.assignRole).toHaveBeenCalledWith('bo', HOUSEMATE.id);
      expect(limits.saveRoleStreamLimit).toHaveBeenCalledWith(HOUSEMATE.id, {
        maxBitrateKbps: null,
        maxStreams: 1,
        maxQuality: null,
        limitsDownloads: false,
      });
    });

    it('drops the role being made on Cancel', async () => {
      const user = userEvent.setup();
      renderInAnAddress(<RolesPanel />);

      await waitForOpen('Administrator');
      await user.click(screen.getByRole('button', { name: 'Create role' }));
      await screen.findByRole('form', { name: 'Create a role' });
      await user.click(screen.getByRole('button', { name: 'Cancel' }));

      await waitForOpen('Administrator');

      expect(screen.queryByRole('button', { name: 'New role' })).not.toBeInTheDocument();
      expect(mocks.createRole).not.toHaveBeenCalled();
    });
  });

  describe('putting the roles in order', () => {
    it('moves a role up, sending every role in its new order', async () => {
      const user = userEvent.setup();
      renderInAnAddress(<RolesPanel />);

      await pickFromMenu(user, 'Member', /Move up/);

      await waitFor(() => {
        expect(mocks.orderRoles).toHaveBeenCalledWith([ADMINISTRATOR.id, MEMBER.id, MODERATOR.id]);
      });
    });

    it('moves a role down, sending every role in its new order', async () => {
      const user = userEvent.setup();
      renderInAnAddress(<RolesPanel />);

      await pickFromMenu(user, 'Administrator', /Move down/);

      await waitFor(() => {
        expect(mocks.orderRoles).toHaveBeenCalledWith([MODERATOR.id, ADMINISTRATOR.id, MEMBER.id]);
      });
    });

    it('keeps roles out of reach on top of the order it sends', async () => {
      mocks.fetchRoles.mockResolvedValue({ roles: ROLES, outOfReach: [ADMINISTRATOR.id] });

      const user = userEvent.setup();
      renderInAnAddress(<RolesPanel />);

      await pickFromMenu(user, 'Member', /Move up/);

      await waitFor(() => {
        expect(mocks.orderRoles).toHaveBeenCalledWith([ADMINISTRATOR.id, MEMBER.id, MODERATOR.id]);
      });
    });

    it('reads the roles again once the order is sent', async () => {
      const user = userEvent.setup();
      renderInAnAddress(<RolesPanel />);

      await pickFromMenu(user, 'Member', /Move up/);

      await waitFor(() => {
        expect(mocks.fetchRoles).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('roles out of reach', () => {
    beforeEach(() => {
      mocks.fetchRoles.mockResolvedValue({ roles: ROLES, outOfReach: [ADMINISTRATOR.id] });
    });

    it('wear a lock and have no menu', async () => {
      renderInAnAddress(<RolesPanel />);

      const above = await screen.findByRole('list', { name: 'Roles above yours' });

      expect(within(above).getByText('Administrator')).toBeInTheDocument();
      expect(within(above).getByRole('img', { name: 'Above your role' })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Actions for Administrator' })).toBeNull();
      expect(screen.getByRole('button', { name: 'Actions for Member' })).toBeInTheDocument();
    });

    it('open read-only, saying why', async () => {
      const user = userEvent.setup();
      renderInAnAddress(<RolesPanel />);

      await waitForOpen('Moderator');
      await user.click(
        within(screen.getByRole('list', { name: 'Roles above yours' })).getByRole('button', {
          name: /Administrator/,
        }),
      );
      await waitForOpen('Administrator');

      expect(
        screen.getByText('This role is at or above yours, so you can’t change it.'),
      ).toBeInTheDocument();
      expect(screen.getByRole('textbox', { name: 'Name' })).toBeDisabled();
      expect(screen.getByRole('switch', { name: 'Everything' })).toBeDisabled();
    });
  });

  describe('deleting a role', () => {
    it('asks first, then deletes it and reads the roles again', async () => {
      const user = userEvent.setup();
      renderInAnAddress(<RolesPanel />);

      await pickFromMenu(user, 'Moderator', /Delete role/);

      const asking = await screen.findByRole('dialog', { name: 'Delete this role?' });

      expect(asking).toHaveTextContent('Moderator will be deleted');
      expect(mocks.deleteRole).not.toHaveBeenCalled();

      await user.click(within(asking).getByRole('button', { name: 'Delete role' }));

      await waitFor(() => {
        expect(mocks.deleteRole).toHaveBeenCalledWith(MODERATOR.id);
      });
      await waitFor(() => {
        expect(mocks.fetchRoles).toHaveBeenCalledTimes(2);
      });
    });

    it('deletes nothing where the person cancels', async () => {
      const user = userEvent.setup();
      renderInAnAddress(<RolesPanel />);

      await pickFromMenu(user, 'Moderator', /Delete role/);
      await user.click(
        within(await screen.findByRole('dialog', { name: 'Delete this role?' })).getByRole(
          'button',
          { name: 'Cancel' },
        ),
      );

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
      expect(mocks.deleteRole).not.toHaveBeenCalled();
    });

    it('refuses for a role that grants everything', async () => {
      const user = userEvent.setup();
      renderInAnAddress(<RolesPanel />);

      await user.click(await screen.findByRole('button', { name: 'Actions for Administrator' }));

      const remove = await screen.findByRole('menuitem', { name: /Delete role/ });

      expect(remove).toHaveAttribute('aria-disabled', 'true');

      await user.click(remove);

      expect(screen.queryByRole('dialog', { name: 'Delete this role?' })).not.toBeInTheDocument();
      expect(mocks.deleteRole).not.toHaveBeenCalled();
    });
  });

  it('sets a display name so devtools can identify it', () => {
    expect(RolesPanel.displayName).toBe('RolesPanel');
  });
});
