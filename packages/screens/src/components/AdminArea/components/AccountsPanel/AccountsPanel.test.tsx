import { screen, waitFor } from '@testing-library/react';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AccountsPanel } from './AccountsPanel';
import type { Account } from '@ValenceClient/admin/fetchAccounts';

const accountMocks = vi.hoisted(() => ({
  fetchAccounts: vi.fn(),
  inviteAccount: vi.fn(),
  banAccount: vi.fn(),
  unbanAccount: vi.fn(),
  removeAccount: vi.fn(),
}));

vi.mock('@ValenceClient/admin/fetchAccounts', () => accountMocks);

const mocks = vi.hoisted(() => ({
  fetchPermissionCatalogue: vi.fn(),
  fetchRoles: vi.fn(),
  fetchAccountPermissions: vi.fn(),
  assignRole: vi.fn(),
  removeRole: vi.fn(),
}));

vi.mock('@ValenceClient/admin/fetchRoles', () => mocks);

const accessMocks = vi.hoisted(() => ({
  fetchLibraryAccess: vi.fn(),
  setLibraryAccess: vi.fn(),
  setCeiling: vi.fn(),
}));

vi.mock('@ValenceClient/admin/fetchLibraryAccess', () => accessMocks);

const FILMS = '2b6f0cc9-04f0-4f26-9f1a-1d5b2ea92d9f';
const SHOWS = '3f2504e0-4f89-41d3-9a0c-0305e82c3301';

const account = (overrides: Partial<Account> = {}): Account => ({
  id: 'usr_1',
  name: 'Dan',
  email: 'dan@valence.local',
  createdAt: '',
  isBanned: false,
  banReason: null,
  position: 100,
  isAdministrator: false,
  face: null,
  roles: ['Member'],
  ...overrides,
});

const ACCOUNTS = [
  account(),
  account({ id: 'usr_2', name: 'Sam', email: 'sam@valence.local', position: null }),
];

const ADMINISTRATOR = {
  id: 'role_1',
  name: 'Administrator',
  position: 300,
  permissions: ['administrator'],
  color: null,
};

const MEMBER = {
  id: 'role_2',
  name: 'Member',
  position: 100,
  permissions: ['sharing.link'],
  color: null,
};

/**
 * Opens a row's action menu and chooses one of the things in it.
 */
const choose = async (user: ReturnType<typeof userEvent.setup>, name: string, action: RegExp) => {
  await user.click(await screen.findByRole('button', { name: `Actions for ${name}` }));
  await user.click(await screen.findByRole('menuitem', { name: action }));
};

/**
 * Chooses something that has to be confirmed, and confirms it.
 */
const confirm = async (
  user: ReturnType<typeof userEvent.setup>,
  name: string,
  action: RegExp,
  answer: string,
) => {
  await choose(user, name, action);
  await user.click(await screen.findByRole('button', { name: answer }));
};

/**
 * Opens the dialog that adds somebody.
 */
const openInvite = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(await screen.findByRole('button', { name: /Add user/ }));
};

/**
 * Opens Dan's account for editing on one of its tabs.
 */
const edit = async (user: ReturnType<typeof userEvent.setup>, tab: 'Roles' | 'Libraries') => {
  await choose(user, 'Dan', /Edit account/);
  await user.click(await screen.findByRole('tab', { name: tab }));
};

/**
 * Opens Dan's roles once the server has said which ones he holds, since the switches are drawn from
 * the list of roles before that answer lands and a press made too early would be overwritten by it.
 */
const editRoles = async (user: ReturnType<typeof userEvent.setup>) => {
  await edit(user, 'Roles');

  await waitFor(() => {
    expect(screen.getByRole('switch', { name: 'Whether Dan holds Member' })).toBeChecked();
  });
};

/**
 * Saves whatever has been changed in the open editor.
 */
const save = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(await screen.findByRole('button', { name: 'Save changes' }));
};

describe('AccountsPanel', () => {
  beforeEach(() => {
    for (const mock of [...Object.values(mocks), ...Object.values(accountMocks)]) {
      mock.mockReset();
    }

    accountMocks.fetchAccounts.mockResolvedValue(ACCOUNTS);
    accountMocks.inviteAccount.mockResolvedValue(null);
    accountMocks.banAccount.mockResolvedValue(null);
    accountMocks.unbanAccount.mockResolvedValue(null);
    accountMocks.removeAccount.mockResolvedValue(null);

    mocks.fetchPermissionCatalogue.mockResolvedValue(['jobs.run', 'jobs.runDestructive']);
    mocks.fetchRoles.mockResolvedValue([ADMINISTRATOR, MEMBER]);
    mocks.fetchAccountPermissions.mockResolvedValue({
      roles: [MEMBER],
      overrides: [],
      effective: ['sharing.link'],
    });
    mocks.assignRole.mockResolvedValue(null);
    mocks.removeRole.mockResolvedValue(null);

    accessMocks.fetchLibraryAccess.mockReset().mockResolvedValue([
      { id: FILMS, name: 'Films', mayView: true, maximumAge: null, allowsUnrated: false },
      { id: SHOWS, name: 'Shows', mayView: true, maximumAge: null, allowsUnrated: false },
    ]);
    accessMocks.setLibraryAccess.mockReset().mockResolvedValue(null);
    accessMocks.setCeiling.mockReset().mockResolvedValue(null);
  });

  it('lists everybody with an account', async () => {
    renderInAnAddress(<AccountsPanel />);

    expect(await screen.findByText('dan@valence.local')).toBeInTheDocument();
    expect(screen.getByText('sam@valence.local')).toBeInTheDocument();
  });

  it('lists them alphabetically by name to begin with, whatever order the server sent', async () => {
    accountMocks.fetchAccounts.mockResolvedValue([
      account({ id: 'usr_z', name: 'Zed', email: 'zed@valence.local' }),
      account({ id: 'usr_a', name: 'Ada', email: 'ada@valence.local' }),
      account({ id: 'usr_m', name: 'moss', email: 'moss@valence.local' }),
    ]);

    renderInAnAddress(<AccountsPanel />);

    await screen.findByText('ada@valence.local');

    const emails = screen.getAllByText(/@valence\.local/).map((cell) => cell.textContent ?? '');

    expect(emails).toEqual(['ada@valence.local', 'moss@valence.local', 'zed@valence.local']);
  });

  it('says when nobody has one', async () => {
    accountMocks.fetchAccounts.mockResolvedValue([]);

    renderInAnAddress(<AccountsPanel />);

    expect(await screen.findByText('Nobody has an account yet.')).toBeInTheDocument();
  });

  it('asks the server for nobody until somebody is picked', async () => {
    renderInAnAddress(<AccountsPanel />);

    await screen.findByText('dan@valence.local');

    expect(mocks.fetchAccountPermissions).not.toHaveBeenCalled();
  });

  it('shows every role on the row, so a change is visible without opening it', async () => {
    accountMocks.fetchAccounts.mockResolvedValue([account({ roles: ['Manager', 'Member'] })]);

    renderInAnAddress(<AccountsPanel />);

    expect(await screen.findByText('Manager')).toBeInTheDocument();
    expect(screen.getByText('Member')).toBeInTheDocument();
  });

  it('draws each role in the colour that role was given, not by whether it is the administrator', async () => {
    mocks.fetchRoles.mockResolvedValue([
      { ...ADMINISTRATOR, color: '#E74C3C' },
      { ...MEMBER, color: '#206694' },
    ]);
    accountMocks.fetchAccounts.mockResolvedValue([
      account({ isAdministrator: true, roles: ['Administrator', 'Member', 'Manager'] }),
    ]);

    renderInAnAddress(<AccountsPanel />);

    await waitFor(() => {
      expect(screen.getByText('Administrator')).toHaveStyle({
        backgroundColor: 'rgb(231, 76, 60)',
      });
    });

    expect(screen.getByText('Member')).toHaveStyle({ backgroundColor: 'rgb(32, 102, 148)' });
    expect(screen.getByText('Manager').getAttribute('style')).toBeNull();
  });

  it('says so plainly when somebody holds none', async () => {
    accountMocks.fetchAccounts.mockResolvedValue([account({ roles: [] })]);

    renderInAnAddress(<AccountsPanel />);

    expect(await screen.findByText('No roles')).toBeInTheDocument();
  });

  it('marks an administrator by what they resolve to, not by a column', async () => {
    accountMocks.fetchAccounts.mockResolvedValue([
      account({ isAdministrator: true, roles: ['Administrator'] }),
    ]);

    renderInAnAddress(<AccountsPanel />);

    expect(await screen.findByText('Administrator')).toBeInTheDocument();
  });

  describe('banning', () => {
    it('bans somebody', async () => {
      const user = userEvent.setup();
      renderInAnAddress(<AccountsPanel />);

      await confirm(user, 'Dan', /^Ban$/, 'Ban');

      expect(accountMocks.banAccount).toHaveBeenCalledWith('usr_1', expect.any(String));
    });

    it('shows a ban and why, in place of the address', async () => {
      accountMocks.fetchAccounts.mockResolvedValue([
        account({ isBanned: true, banReason: 'kept pausing the film' }),
      ]);

      renderInAnAddress(<AccountsPanel />);

      expect(await screen.findByText('banned')).toBeInTheDocument();
      expect(screen.getByText(/kept pausing the film/)).toBeInTheDocument();
    });

    it('offers to let a banned account back in rather than banning it again', async () => {
      accountMocks.fetchAccounts.mockResolvedValue([account({ isBanned: true })]);

      const user = userEvent.setup();
      renderInAnAddress(<AccountsPanel />);

      await choose(user, 'Dan', /Let back in/);

      expect(accountMocks.unbanAccount).toHaveBeenCalledWith('usr_1');
      expect(accountMocks.banAccount).not.toHaveBeenCalled();
    });

    it('explains a refusal rather than reporting a failure', async () => {
      accountMocks.banAccount.mockResolvedValue({
        message: 'That would leave nobody able to administer this server.',
      });

      const user = userEvent.setup();
      renderInAnAddress(<AccountsPanel />);

      await confirm(user, 'Dan', /^Ban$/, 'Ban');

      expect(await screen.findByRole('alert')).toHaveTextContent('nobody able to administer');
    });
  });

  describe('adding somebody', () => {
    it('will not add until every field is filled', async () => {
      const user = userEvent.setup();
      renderInAnAddress(<AccountsPanel />);

      await openInvite(user);

      expect(screen.getByRole('button', { name: 'Add' })).toBeDisabled();
    });

    it('will not accept a password too short to be one', async () => {
      const user = userEvent.setup();
      renderInAnAddress(<AccountsPanel />);

      await openInvite(user);
      await user.type(screen.getByLabelText('Name'), 'Alex');
      await user.type(screen.getByLabelText('Address'), 'alex@valence.local');
      await user.type(screen.getByLabelText('Password'), 'short');

      expect(screen.getByRole('button', { name: 'Add' })).toBeDisabled();
    });

    it('adds somebody', async () => {
      const user = userEvent.setup();
      renderInAnAddress(<AccountsPanel />);

      await openInvite(user);
      await user.type(screen.getByLabelText('Name'), 'Alex');
      await user.type(screen.getByLabelText('Address'), 'alex@valence.local');
      await user.type(screen.getByLabelText('Password'), 'a-long-enough-password');
      await user.click(screen.getByRole('button', { name: 'Add' }));

      expect(accountMocks.inviteAccount).toHaveBeenCalledWith({
        name: 'Alex',
        email: 'alex@valence.local',
        password: 'a-long-enough-password',
      });
    });

    it('says the password has to be handed over, since Valence cannot send it', async () => {
      const user = userEvent.setup();
      renderInAnAddress(<AccountsPanel />);

      await openInvite(user);

      expect(screen.getByText(/tell them this password yourself/)).toBeInTheDocument();
    });

    it('explains a refusal', async () => {
      accountMocks.inviteAccount.mockResolvedValue({
        message: 'That address is already in use.',
      });

      const user = userEvent.setup();
      renderInAnAddress(<AccountsPanel />);

      await openInvite(user);
      await user.type(screen.getByLabelText('Name'), 'Alex');
      await user.type(screen.getByLabelText('Address'), 'dan@valence.local');
      await user.type(screen.getByLabelText('Password'), 'a-long-enough-password');
      await user.click(screen.getByRole('button', { name: 'Add' }));

      expect(await screen.findByRole('alert')).toHaveTextContent('already in use');
    });
  });

  describe('removing', () => {
    it('removes somebody', async () => {
      const user = userEvent.setup();
      renderInAnAddress(<AccountsPanel />);

      await confirm(user, 'Dan', /Delete account/, 'Delete account');

      expect(accountMocks.removeAccount).toHaveBeenCalledWith('usr_1');
    });

    it('explains a refusal', async () => {
      accountMocks.removeAccount.mockResolvedValue({
        message: 'You cannot do that to your own account.',
      });

      const user = userEvent.setup();
      renderInAnAddress(<AccountsPanel />);

      await confirm(user, 'Dan', /Delete account/, 'Delete account');

      expect(await screen.findByRole('alert')).toHaveTextContent('your own account');
    });
  });

  it('opens somebody for editing, named as theirs', async () => {
    const user = userEvent.setup();
    renderInAnAddress(<AccountsPanel />);

    await choose(user, 'Dan', /Edit account/);

    expect(await screen.findByRole('heading', { name: 'Edit Dan' })).toBeInTheDocument();
  });

  it('closes the editor without having to pick another account', async () => {
    const user = userEvent.setup();
    renderInAnAddress(<AccountsPanel />);

    await choose(user, 'Dan', /Edit account/);
    await user.click(await screen.findByRole('button', { name: 'Close' }));

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('will not save until something has changed', async () => {
    const user = userEvent.setup();
    renderInAnAddress(<AccountsPanel />);

    await editRoles(user);

    expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled();
  });

  describe('roles', () => {
    it('marks the ones they hold', async () => {
      const user = userEvent.setup();
      renderInAnAddress(<AccountsPanel />);

      await editRoles(user);

      expect(screen.getByRole('switch', { name: 'Whether Dan holds Member' })).toBeChecked();
      expect(
        screen.getByRole('switch', { name: 'Whether Dan holds Administrator' }),
      ).not.toBeChecked();
    });

    it('gives one they do not hold', async () => {
      const user = userEvent.setup();
      renderInAnAddress(<AccountsPanel />);

      await editRoles(user);
      await user.click(screen.getByRole('switch', { name: 'Whether Dan holds Administrator' }));
      await save(user);

      await waitFor(() => {
        expect(mocks.assignRole).toHaveBeenCalledWith('usr_1', 'role_1');
      });
    });

    it('takes back one they do', async () => {
      const user = userEvent.setup();
      renderInAnAddress(<AccountsPanel />);

      await editRoles(user);
      await user.click(screen.getByRole('switch', { name: 'Whether Dan holds Member' }));
      await save(user);

      await waitFor(() => {
        expect(mocks.removeRole).toHaveBeenCalledWith('usr_1', 'role_2');
      });
    });

    it('changes nothing until saved', async () => {
      const user = userEvent.setup();
      renderInAnAddress(<AccountsPanel />);

      await editRoles(user);
      await user.click(screen.getByRole('switch', { name: 'Whether Dan holds Administrator' }));

      expect(mocks.assignRole).not.toHaveBeenCalled();
    });

    it('reads their permissions again once a change lands', async () => {
      const user = userEvent.setup();
      renderInAnAddress(<AccountsPanel />);

      await editRoles(user);
      await user.click(screen.getByRole('switch', { name: 'Whether Dan holds Administrator' }));
      await save(user);

      await waitFor(() => {
        expect(mocks.fetchAccountPermissions).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('refusals', () => {
    it('explains one rather than reporting a failure', async () => {
      mocks.assignRole.mockResolvedValue({ message: 'That role is at or above your own.' });

      const user = userEvent.setup();
      renderInAnAddress(<AccountsPanel />);

      await editRoles(user);
      await user.click(screen.getByRole('switch', { name: 'Whether Dan holds Administrator' }));
      await save(user);

      expect(await screen.findByRole('alert')).toHaveTextContent('at or above your own');
    });

    it('explains a lockout the server refused', async () => {
      mocks.removeRole.mockResolvedValue({
        message: 'That would leave nobody able to administer this server.',
      });

      const user = userEvent.setup();
      renderInAnAddress(<AccountsPanel />);

      await editRoles(user);
      await user.click(screen.getByRole('switch', { name: 'Whether Dan holds Member' }));
      await save(user);

      expect(await screen.findByRole('alert')).toHaveTextContent('nobody able to administer');
    });

    it('says nothing when the server was happy', async () => {
      const user = userEvent.setup();
      renderInAnAddress(<AccountsPanel />);

      await editRoles(user);
      await user.click(screen.getByRole('switch', { name: 'Whether Dan holds Administrator' }));
      await save(user);

      await waitFor(() => {
        expect(mocks.assignRole).toHaveBeenCalled();
      });

      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  it('sets a display name so devtools can identify it', () => {
    expect(AccountsPanel.displayName).toBe('AccountsPanel');
  });
});

describe('which libraries an account may see', () => {
  beforeEach(() => {
    for (const mock of [...Object.values(mocks), ...Object.values(accountMocks)]) {
      mock.mockReset();
    }

    accountMocks.fetchAccounts.mockResolvedValue(ACCOUNTS);

    mocks.fetchPermissionCatalogue.mockResolvedValue([]);
    mocks.fetchRoles.mockResolvedValue([ADMINISTRATOR, MEMBER]);
    mocks.fetchAccountPermissions.mockResolvedValue({
      roles: [MEMBER],
      overrides: [],
      effective: ['sharing.link'],
    });

    accessMocks.fetchLibraryAccess.mockReset().mockResolvedValue([
      { id: FILMS, name: 'Films', mayView: true, maximumAge: null, allowsUnrated: false },
      { id: SHOWS, name: 'Shows', mayView: true, maximumAge: null, allowsUnrated: false },
    ]);
    accessMocks.setLibraryAccess.mockReset().mockResolvedValue(null);
    accessMocks.setCeiling.mockReset().mockResolvedValue(null);
  });

  it('shows each one, and whether it may be seen', async () => {
    const user = userEvent.setup();

    renderInAnAddress(<AccountsPanel />);

    await edit(user, 'Libraries');

    expect(await screen.findByRole('button', { name: /Keep Films from Dan/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: /Keep Shows from Dan/ })).toBeInTheDocument();
  });

  it('says plainly that an untouched account sees everything', async () => {
    const user = userEvent.setup();

    renderInAnAddress(<AccountsPanel />);

    await edit(user, 'Libraries');

    expect(await screen.findByText(/Everything, until you say otherwise/i)).toBeInTheDocument();
  });

  it('takes one away when asked', async () => {
    const user = userEvent.setup();

    renderInAnAddress(<AccountsPanel />);

    await edit(user, 'Libraries');
    await user.click(await screen.findByRole('button', { name: /Keep Films from Dan/ }));
    await save(user);

    await waitFor(() => {
      expect(accessMocks.setLibraryAccess).toHaveBeenCalledWith('usr_1', FILMS, false);
    });
  });

  it('gives one back when asked', async () => {
    const user = userEvent.setup();

    accessMocks.fetchLibraryAccess.mockResolvedValue([
      { id: FILMS, name: 'Films', mayView: false, maximumAge: null, allowsUnrated: false },
      { id: SHOWS, name: 'Shows', mayView: true, maximumAge: null, allowsUnrated: false },
    ]);

    renderInAnAddress(<AccountsPanel />);

    await edit(user, 'Libraries');
    await user.click(await screen.findByRole('button', { name: /Let Dan see Films/ }));
    await save(user);

    await waitFor(() => {
      expect(accessMocks.setLibraryAccess).toHaveBeenCalledWith('usr_1', FILMS, true);
    });
  });

  it('warns where an account has been left able to reach nothing', async () => {
    const user = userEvent.setup();

    accessMocks.fetchLibraryAccess.mockResolvedValue([
      { id: FILMS, name: 'Films', mayView: false, maximumAge: null, allowsUnrated: false },
      { id: SHOWS, name: 'Shows', mayView: false, maximumAge: null, allowsUnrated: false },
    ]);

    renderInAnAddress(<AccountsPanel />);

    await edit(user, 'Libraries');

    expect(await screen.findByText(/can reach nothing at all/i)).toBeInTheDocument();
  });

  it('says nothing of the sort while they can still reach one', async () => {
    const user = userEvent.setup();

    renderInAnAddress(<AccountsPanel />);

    await edit(user, 'Libraries');
    await screen.findByRole('button', { name: /Keep Films from Dan/ });

    expect(screen.queryByText(/can reach nothing at all/i)).not.toBeInTheDocument();
  });

  it('copes with a server that has no libraries yet', async () => {
    const user = userEvent.setup();

    accessMocks.fetchLibraryAccess.mockResolvedValue([]);

    renderInAnAddress(<AccountsPanel />);

    await edit(user, 'Libraries');

    expect(await screen.findByText(/There are no libraries yet/i)).toBeInTheDocument();
  });
});

describe('the age an account is limited to', () => {
  beforeEach(() => {
    for (const mock of [...Object.values(mocks), ...Object.values(accountMocks)]) {
      mock.mockReset();
    }

    accountMocks.fetchAccounts.mockResolvedValue(ACCOUNTS);
    mocks.fetchPermissionCatalogue.mockResolvedValue([]);
    mocks.fetchRoles.mockResolvedValue([ADMINISTRATOR, MEMBER]);
    mocks.fetchAccountPermissions.mockResolvedValue({
      roles: [MEMBER],
      overrides: [],
      effective: [],
    });

    accessMocks.fetchLibraryAccess
      .mockReset()
      .mockResolvedValue([
        { id: FILMS, name: 'Films', mayView: true, maximumAge: null, allowsUnrated: false },
      ]);
    accessMocks.setLibraryAccess.mockReset().mockResolvedValue(null);
    accessMocks.setCeiling.mockReset().mockResolvedValue(null);
  });

  it('says there is no ceiling until somebody sets one', async () => {
    const user = userEvent.setup();

    renderInAnAddress(<AccountsPanel />);

    await edit(user, 'Libraries');

    expect(await screen.findByText('No ceiling')).toBeInTheDocument();
  });

  it('sets one for that library alone', async () => {
    const user = userEvent.setup();

    renderInAnAddress(<AccountsPanel />);

    await edit(user, 'Libraries');
    await user.click(await screen.findByRole('button', { name: /Age limit in Films for Dan/ }));
    await user.click(await screen.findByRole('menuitemradio', { name: /Up to 12/ }));
    await save(user);

    await waitFor(() => {
      expect(accessMocks.setCeiling).toHaveBeenCalledWith('usr_1', FILMS, {
        maximumAge: 12,
        allowsUnrated: false,
      });
    });
  });

  it('lifts one again', async () => {
    const user = userEvent.setup();

    accessMocks.fetchLibraryAccess.mockResolvedValue([
      { id: FILMS, name: 'Films', mayView: true, maximumAge: 12, allowsUnrated: false },
    ]);

    renderInAnAddress(<AccountsPanel />);

    await edit(user, 'Libraries');
    await user.click(await screen.findByRole('button', { name: /Age limit in Films for Dan/ }));
    await user.click(await screen.findByRole('menuitemradio', { name: /No ceiling/ }));
    await save(user);

    await waitFor(() => {
      expect(accessMocks.setCeiling).toHaveBeenCalledWith('usr_1', FILMS, null);
    });
  });

  it('offers the unrated escape only once a ceiling exists', async () => {
    const user = userEvent.setup();

    renderInAnAddress(<AccountsPanel />);

    await edit(user, 'Libraries');
    await screen.findByText('No ceiling');

    expect(screen.queryByRole('button', { name: /Allow uncertificated/ })).not.toBeInTheDocument();
  });

  it('turns the unrated escape on without losing the ceiling', async () => {
    const user = userEvent.setup();

    accessMocks.fetchLibraryAccess.mockResolvedValue([
      { id: FILMS, name: 'Films', mayView: true, maximumAge: 15, allowsUnrated: false },
    ]);

    renderInAnAddress(<AccountsPanel />);

    await edit(user, 'Libraries');
    await user.click(await screen.findByRole('button', { name: /Allow uncertificated/ }));
    await save(user);

    await waitFor(() => {
      expect(accessMocks.setCeiling).toHaveBeenCalledWith('usr_1', FILMS, {
        maximumAge: 15,
        allowsUnrated: true,
      });
    });
  });

  it('says a limit reaches every face on the account, and how to avoid that', async () => {
    const user = userEvent.setup();

    accessMocks.fetchLibraryAccess.mockResolvedValue([
      { id: FILMS, name: 'Films', mayView: true, maximumAge: 12, allowsUnrated: false },
    ]);

    renderInAnAddress(<AccountsPanel />);

    await edit(user, 'Libraries');

    expect(await screen.findByText(/every face on it/i)).toBeInTheDocument();
    expect(await screen.findByText(/give the child an account of their own/i)).toBeInTheDocument();
  });

  it('says nothing of the sort while no limit is set', async () => {
    const user = userEvent.setup();

    renderInAnAddress(<AccountsPanel />);

    await edit(user, 'Libraries');
    await screen.findByText('No ceiling');

    expect(screen.queryByText(/every face on it/i)).not.toBeInTheDocument();
  });
});
