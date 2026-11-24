import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { somePluginContributions } from '@ValenceClient/testing/somePluginContributions';
import type { Account } from '@ValenceClient/admin/fetchAccounts';
import type { Role } from '@ValenceContracts/schemas/Permission';
import type { StreamLimit } from '@ValenceContracts/schemas/StreamLimit';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import { RoleEditor } from './RoleEditor';
import type { RoleEditorProps } from './RoleEditor.types';

const mocks = vi.hoisted(() => ({
  createRole: vi.fn(),
  updateRole: vi.fn(),
  assignRole: vi.fn(),
  removeRole: vi.fn(),
}));

const limits = vi.hoisted(() => ({
  roleStreamLimit: vi.fn(),
  saveRoleStreamLimit: vi.fn(),
}));

vi.mock('@ValenceClient/admin/fetchRoles', () => mocks);

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

const FREE: StreamLimit = {
  maxBitrateKbps: null,
  maxStreams: null,
  maxQuality: null,
  limitsDownloads: false,
};

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

const ADMINISTRATOR: Role = {
  id: 'role_1',
  name: 'Administrator',
  position: 300,
  color: null,
  permissions: ['administrator'],
};

const MEMBER: Role = {
  id: 'role_2',
  name: 'Member',
  position: 100,
  color: null,
  permissions: ['sharing.link'],
};

const ACCOUNTS = [anAccount('ada', 'Ada', ['Member']), anAccount('bo', 'Bo', [])];

/**
 * Draws the editor open on Member unless told otherwise.
 *
 * @param overrides - Anything about the editor that matters to the test.
 * @returns The props it was drawn with.
 */
const draw = (overrides: Partial<RoleEditorProps> = {}): RoleEditorProps => {
  const props: RoleEditorProps = {
    role: MEMBER,
    roles: [ADMINISTRATOR, MEMBER],
    outOfReach: new Set(),
    isOutOfReach: false,
    catalogue: ['administrator', 'jobs.run', 'sharing.link'],
    accounts: ACCOUNTS,
    onChange: vi.fn(),
    onSaved: vi.fn(),
    onCancel: vi.fn(),
    ...overrides,
  };

  renderInAnAddress(<RoleEditor {...props} />);

  return props;
};

/**
 * Moves the editor to one of its tabs.
 *
 * @param user - Who is pressing.
 * @param name - The tab's name.
 */
const openTab = async (user: ReturnType<typeof userEvent.setup>, name: string | RegExp) => {
  await user.click(screen.getByRole('tab', { name }));
};

beforeEach(() => {
  for (const mock of [...Object.values(mocks), ...Object.values(limits)]) {
    mock.mockReset();
  }

  mocks.createRole.mockResolvedValue({ role: null, refusal: null });
  mocks.updateRole.mockResolvedValue(null);
  mocks.assignRole.mockResolvedValue(null);
  mocks.removeRole.mockResolvedValue(null);
  limits.roleStreamLimit.mockResolvedValue(FREE);
  limits.saveRoleStreamLimit.mockResolvedValue(FREE);
});

describe('RoleEditor', () => {
  it('opens on the role’s name and its permissions, with nothing to save', () => {
    const props = draw();

    expect(screen.getByRole('form', { name: 'Edit Member' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Name' })).toHaveValue('Member');
    expect(screen.getByRole('tab', { name: 'Permissions', selected: true })).toBeInTheDocument();
    expect(screen.getByRole('switch', { name: 'Create share links' })).toBeChecked();
    expect(screen.queryByRole('button', { name: 'Save changes' })).not.toBeInTheDocument();
    expect(props.onChange).toHaveBeenLastCalledWith({ name: 'Member', isChanged: false });
  });

  it('counts the role’s members on their tab', () => {
    draw();

    expect(screen.getByRole('tab', { name: 'Members (1)' })).toBeInTheDocument();
  });

  it('raises the save bar once something changes, and tells the panel', async () => {
    const user = userEvent.setup();
    const props = draw();

    await user.type(screen.getByRole('textbox', { name: 'Name' }), 's');

    expect(screen.getByRole('status')).toHaveTextContent('You have unsaved changes');
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeInTheDocument();
    expect(props.onChange).toHaveBeenLastCalledWith({ name: 'Members', isChanged: true });
  });

  it('saves only the name where only the name changed', async () => {
    const user = userEvent.setup();
    const props = draw();

    await user.type(screen.getByRole('textbox', { name: 'Name' }), 's');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() => {
      expect(props.onSaved).toHaveBeenCalledWith(MEMBER.id);
    });
    expect(mocks.updateRole).toHaveBeenCalledWith(MEMBER.id, { name: 'Members' });
    expect(mocks.assignRole).not.toHaveBeenCalled();
    expect(mocks.removeRole).not.toHaveBeenCalled();
    expect(limits.saveRoleStreamLimit).not.toHaveBeenCalled();
  });

  it('saves only the permissions where only the permissions changed', async () => {
    const user = userEvent.setup();
    const props = draw();

    await user.click(screen.getByRole('switch', { name: 'Run and schedule jobs' }));
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() => {
      expect(props.onSaved).toHaveBeenCalledWith(MEMBER.id);
    });
    expect(mocks.updateRole).toHaveBeenCalledWith(MEMBER.id, {
      permissions: ['sharing.link', 'jobs.run'],
    });
  });

  it('gives and takes the role as switched on its members tab, and no more', async () => {
    const user = userEvent.setup();
    const props = draw();

    await openTab(user, 'Members (1)');
    await user.click(screen.getByRole('switch', { name: 'Bo has this role' }));
    await user.click(screen.getByRole('switch', { name: 'Ada has this role' }));
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() => {
      expect(props.onSaved).toHaveBeenCalledWith(MEMBER.id);
    });
    expect(mocks.assignRole).toHaveBeenCalledWith('bo', MEMBER.id);
    expect(mocks.removeRole).toHaveBeenCalledWith('ada', MEMBER.id);
    expect(mocks.updateRole).not.toHaveBeenCalled();
    expect(limits.saveRoleStreamLimit).not.toHaveBeenCalled();
  });

  it('counts members as the draft stands', async () => {
    const user = userEvent.setup();

    draw();

    await openTab(user, 'Members (1)');
    await user.click(screen.getByRole('switch', { name: 'Bo has this role' }));

    expect(screen.getByRole('tab', { name: 'Members (2)' })).toBeInTheDocument();
  });

  it('saves only the streaming limit where only the limit changed', async () => {
    const user = userEvent.setup();
    const props = draw();

    await waitFor(() => {
      expect(limits.roleStreamLimit).toHaveBeenCalledWith(MEMBER.id);
    });
    await openTab(user, 'Streaming');
    await user.click(screen.getByRole('button', { name: 'Highest quality' }));
    await user.click(await screen.findByRole('menuitemradio', { name: '720p' }));
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() => {
      expect(props.onSaved).toHaveBeenCalledWith(MEMBER.id);
    });
    expect(limits.saveRoleStreamLimit).toHaveBeenCalledWith(MEMBER.id, {
      maxBitrateKbps: null,
      maxStreams: null,
      maxQuality: '720p',
      limitsDownloads: false,
    });
    expect(mocks.updateRole).not.toHaveBeenCalled();
  });

  it('counts a limit chosen and then put back as no change', async () => {
    const user = userEvent.setup();

    draw();

    await waitFor(() => {
      expect(limits.roleStreamLimit).toHaveBeenCalledWith(MEMBER.id);
    });
    await openTab(user, 'Streaming');
    await user.click(screen.getByRole('button', { name: 'Streams at once' }));
    await user.click(await screen.findByRole('menuitemradio', { name: '2' }));

    expect(screen.getByRole('button', { name: 'Save changes' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Streams at once' }));
    await user.click(await screen.findByRole('menuitemradio', { name: 'No limit' }));

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: 'Save changes' })).not.toBeInTheDocument();
    });
  });

  it('drops every change on Reset', async () => {
    const user = userEvent.setup();
    const props = draw();

    await user.type(screen.getByRole('textbox', { name: 'Name' }), 's');
    await user.click(screen.getByRole('switch', { name: 'Run and schedule jobs' }));
    await user.click(screen.getByRole('button', { name: 'Reset' }));

    expect(screen.getByRole('textbox', { name: 'Name' })).toHaveValue('Member');
    expect(screen.getByRole('switch', { name: 'Run and schedule jobs' })).not.toBeChecked();
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: 'Save changes' })).not.toBeInTheDocument();
    });
    expect(props.onChange).toHaveBeenLastCalledWith({ name: 'Member', isChanged: false });
  });

  it('will not save a role with no name', async () => {
    const user = userEvent.setup();
    const props = draw();

    await user.clear(screen.getByRole('textbox', { name: 'Name' }));
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent('Give the role a name.');
    });
    expect(mocks.updateRole).not.toHaveBeenCalled();
    expect(props.onSaved).not.toHaveBeenCalled();
  });

  it('says why the server refused, keeping what was changed', async () => {
    mocks.updateRole.mockResolvedValue({ message: 'That role is equal to or higher than yours.' });

    const user = userEvent.setup();
    const props = draw();

    await user.type(screen.getByRole('textbox', { name: 'Name' }), 's');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent('equal to or higher than yours');
    });
    expect(screen.getByRole('textbox', { name: 'Name' })).toHaveValue('Members');
    expect(props.onSaved).not.toHaveBeenCalled();
  });

  it('stops at the first refusal, saving nothing after it', async () => {
    mocks.updateRole.mockResolvedValue({ message: 'That role is equal to or higher than yours.' });

    const user = userEvent.setup();

    draw();

    await user.type(screen.getByRole('textbox', { name: 'Name' }), 's');
    await openTab(user, 'Members (1)');
    await user.click(screen.getByRole('switch', { name: 'Bo has this role' }));
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent('equal to or higher than yours');
    });
    expect(mocks.assignRole).not.toHaveBeenCalled();
  });

  describe('making a role', () => {
    it('opens with the bar up, saying the role is not saved, and an empty name', () => {
      draw({ role: null });

      expect(screen.getByRole('form', { name: 'Create a role' })).toBeInTheDocument();
      expect(screen.getByRole('textbox', { name: 'Name' })).toHaveValue('');
      expect(screen.getByRole('status')).toHaveTextContent('This role isn’t saved yet');
      expect(screen.getByRole('tab', { name: 'Members (0)' })).toBeInTheDocument();
      expect(limits.roleStreamLimit).not.toHaveBeenCalled();
    });

    it('is abandoned with Cancel', async () => {
      const user = userEvent.setup();
      const props = draw({ role: null });

      await user.click(screen.getByRole('button', { name: 'Cancel' }));

      expect(props.onCancel).toHaveBeenCalledTimes(1);
      expect(mocks.createRole).not.toHaveBeenCalled();
    });

    it('will not make a role with no name', async () => {
      const user = userEvent.setup();

      draw({ role: null });

      await user.click(screen.getByRole('button', { name: 'Create role' }));

      await waitFor(() => {
        expect(screen.getByRole('status')).toHaveTextContent('Give the role a name.');
      });
      expect(mocks.createRole).not.toHaveBeenCalled();
    });

    it('makes the role, then gives it its members and limit, and opens it', async () => {
      mocks.createRole.mockResolvedValue({
        role: { ...MEMBER, id: 'role_9', name: 'Housemate', permissions: ['jobs.run'] },
        refusal: null,
      });

      const user = userEvent.setup();
      const props = draw({ role: null });

      await user.type(screen.getByRole('textbox', { name: 'Name' }), ' Housemate ');
      await user.click(screen.getByRole('switch', { name: 'Run and schedule jobs' }));
      await openTab(user, 'Members (0)');
      await user.click(screen.getByRole('switch', { name: 'Bo has this role' }));
      await openTab(user, 'Streaming');
      await user.click(screen.getByRole('button', { name: 'Streams at once' }));
      await user.click(await screen.findByRole('menuitemradio', { name: '3' }));
      await user.click(
        within(screen.getByRole('form', { name: 'Create a role' })).getByRole('button', {
          name: 'Create role',
        }),
      );

      await waitFor(() => {
        expect(props.onSaved).toHaveBeenCalledWith('role_9');
      });
      expect(mocks.createRole).toHaveBeenCalledWith({
        name: 'Housemate',
        color: null,
        permissions: ['jobs.run'],
      });
      expect(mocks.updateRole).not.toHaveBeenCalled();
      expect(mocks.assignRole).toHaveBeenCalledWith('bo', 'role_9');
      expect(limits.saveRoleStreamLimit).toHaveBeenCalledWith('role_9', {
        maxBitrateKbps: null,
        maxStreams: 3,
        maxQuality: null,
        limitsDownloads: false,
      });
    });

    it('makes the role without asking for members or a limit nobody chose', async () => {
      mocks.createRole.mockResolvedValue({
        role: { ...MEMBER, id: 'role_9', name: 'Housemate', permissions: [] },
        refusal: null,
      });

      const user = userEvent.setup();
      const props = draw({ role: null });

      await user.type(screen.getByRole('textbox', { name: 'Name' }), 'Housemate');
      await user.click(screen.getByRole('button', { name: 'Create role' }));

      await waitFor(() => {
        expect(props.onSaved).toHaveBeenCalledWith('role_9');
      });
      expect(mocks.assignRole).not.toHaveBeenCalled();
      expect(limits.saveRoleStreamLimit).not.toHaveBeenCalled();
    });

    it('says why the server would not make it, and stays open', async () => {
      mocks.createRole.mockResolvedValue({
        role: null,
        refusal: { message: 'That role is equal to or higher than yours.' },
      });

      const user = userEvent.setup();
      const props = draw({ role: null });

      await user.type(screen.getByRole('textbox', { name: 'Name' }), 'Housemate');
      await user.click(screen.getByRole('button', { name: 'Create role' }));

      await waitFor(() => {
        expect(screen.getByRole('status')).toHaveTextContent('equal to or higher than yours');
      });
      expect(props.onSaved).not.toHaveBeenCalled();
      expect(screen.getByRole('textbox', { name: 'Name' })).toHaveValue('Housemate');
    });
  });

  describe('a role out of reach', () => {
    it('says it cannot be changed, and shuts everything on it', () => {
      draw({
        role: ADMINISTRATOR,
        outOfReach: new Set([ADMINISTRATOR.id]),
        isOutOfReach: true,
      });

      expect(
        screen.getByText('This role is at or above yours, so you can’t change it.'),
      ).toBeInTheDocument();
      expect(screen.getByRole('textbox', { name: 'Name' })).toBeDisabled();
      expect(screen.getByRole('switch', { name: 'Everything' })).toBeDisabled();
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });

    it('still lets its tabs be read', async () => {
      const user = userEvent.setup();

      draw({
        role: ADMINISTRATOR,
        outOfReach: new Set([ADMINISTRATOR.id]),
        isOutOfReach: true,
      });

      await openTab(user, /Members/);

      expect(screen.getByRole('switch', { name: 'Ada has this role' })).toBeDisabled();
    });

    it('says nothing of a role within reach', () => {
      draw();

      expect(screen.queryByText(/at or above yours/)).not.toBeInTheDocument();
      expect(screen.getByRole('textbox', { name: 'Name' })).toBeEnabled();
    });
  });

  it('sets a display name so devtools can identify it', () => {
    expect(RoleEditor.displayName).toBe('RoleEditor');
  });
});
