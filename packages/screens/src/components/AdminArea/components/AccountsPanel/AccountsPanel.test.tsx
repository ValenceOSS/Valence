import { screen, waitFor } from '@testing-library/react';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AccountsPanel } from './AccountsPanel';
import { notify } from '@ValenceUI/notify';
import type { Account } from '@ValenceClient/admin/fetchAccounts';

const accountMocks = vi.hoisted(() => ({
  fetchAccounts: vi.fn<() => Promise<Account[]>>(),
  inviteAccount: vi.fn(),
  editAccount: vi.fn(),
  banAccount: vi.fn(),
  unbanAccount: vi.fn(),
  removeAccount: vi.fn(),
}));

vi.mock('@ValenceClient/admin/fetchAccounts', () => accountMocks);

const linkMocks = vi.hoisted(() => ({
  canEmailSetupLinks: false,
  issueSetupLink: vi.fn(),
  emailSetupLink: vi.fn(),
  revokeSetupLink: vi.fn(),
}));

vi.mock('@ValenceClient/admin/fetchAccountList', () => ({
  fetchAccountList: async () => ({
    accounts: await accountMocks.fetchAccounts(),
    canEmailSetupLinks: linkMocks.canEmailSetupLinks,
  }),
}));
vi.mock('@ValenceClient/admin/issueSetupLink', () => ({
  issueSetupLink: linkMocks.issueSetupLink,
}));
vi.mock('@ValenceClient/admin/emailSetupLink', () => ({
  emailSetupLink: linkMocks.emailSetupLink,
}));
vi.mock('@ValenceClient/admin/revokeSetupLink', () => ({
  revokeSetupLink: linkMocks.revokeSetupLink,
}));
vi.mock('@ValenceClient/admin/isUsernameAvailable', () => ({
  isUsernameAvailable: () => Promise.resolve(true),
}));

const LINK = { url: 'https://valence.example/welcome/abc', expiresAt: '2099-01-01T00:00:00.000Z' };
vi.mock('@ValenceUI/notify', () => ({
  notify: { worked: vi.fn(), failed: vi.fn() },
}));

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
  username: 'dan',
  discordId: null,
  email: 'dan@valence.local',
  canSignIn: true,
  lastSignedInAt: null,
  setup: { state: 'none', expiresAt: null },
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
  await user.click(await screen.findByRole('button', { name: /Add account/ }));
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
    expect(screen.getByRole('switch', { name: 'Give Dan the Member role' })).toBeChecked();
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
    accountMocks.inviteAccount.mockResolvedValue({
      kind: 'added',
      added: {
        account: account({ id: 'usr_3', name: 'Alex', canSignIn: false }),
        setupLink: LINK,
      },
    });
    linkMocks.canEmailSetupLinks = false;
    linkMocks.issueSetupLink.mockReset().mockResolvedValue({ kind: 'answered', value: LINK });
    linkMocks.emailSetupLink.mockReset().mockResolvedValue({ kind: 'answered', value: LINK });
    linkMocks.revokeSetupLink.mockReset().mockResolvedValue(null);
    accountMocks.banAccount.mockResolvedValue(null);
    accountMocks.unbanAccount.mockResolvedValue(null);
    accountMocks.removeAccount.mockResolvedValue(null);
    accountMocks.editAccount.mockResolvedValue(null);

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

    expect(await screen.findByText('@dan · dan@valence.local')).toBeInTheDocument();
    expect(screen.getByText('@dan · sam@valence.local')).toBeInTheDocument();
  });

  it('lists them alphabetically by name to begin with, whatever order the server sent', async () => {
    accountMocks.fetchAccounts.mockResolvedValue([
      account({ id: 'usr_z', name: 'Zed', username: null, email: 'zed@valence.local' }),
      account({ id: 'usr_a', name: 'Ada', username: null, email: 'ada@valence.local' }),
      account({ id: 'usr_m', name: 'moss', username: null, email: 'moss@valence.local' }),
    ]);

    renderInAnAddress(<AccountsPanel />);

    await screen.findByText('ada@valence.local');

    const emails = screen.getAllByText(/@valence\.local/).map((cell) => cell.textContent ?? '');

    expect(emails).toEqual(['ada@valence.local', 'moss@valence.local', 'zed@valence.local']);
  });

  it('says when nobody has one', async () => {
    accountMocks.fetchAccounts.mockResolvedValue([]);

    renderInAnAddress(<AccountsPanel />);

    expect(await screen.findByText('There are no accounts yet.')).toBeInTheDocument();
  });

  it('asks the server for nobody until somebody is picked', async () => {
    renderInAnAddress(<AccountsPanel />);

    await screen.findByText('@dan · dan@valence.local');

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

      await choose(user, 'Dan', /Unban/);

      expect(accountMocks.unbanAccount).toHaveBeenCalledWith('usr_1');
      expect(accountMocks.banAccount).not.toHaveBeenCalled();
    });

    it('explains a refusal rather than reporting a failure', async () => {
      accountMocks.banAccount.mockResolvedValue({
        message: 'That would leave no administrators on this server.',
      });

      const user = userEvent.setup();
      renderInAnAddress(<AccountsPanel />);

      await confirm(user, 'Dan', /^Ban$/, 'Ban');

      expect(await screen.findByRole('alert')).toHaveTextContent(
        'That would leave no administrators',
      );
    });
  });

  describe('adding somebody', () => {
    it('will not add without a name', async () => {
      const user = userEvent.setup();
      renderInAnAddress(<AccountsPanel />);

      await openInvite(user);
      await user.click(screen.getByRole('button', { name: 'Add' }));

      expect(accountMocks.inviteAccount).not.toHaveBeenCalled();
    });

    it('adds somebody with only a name and hands over their setup link', async () => {
      const user = userEvent.setup();
      renderInAnAddress(<AccountsPanel />);

      await openInvite(user);
      await user.type(screen.getByLabelText('Name'), 'Alex');
      await user.click(screen.getByRole('button', { name: 'Add' }));

      expect(accountMocks.inviteAccount).toHaveBeenCalledWith({ name: 'Alex', lifetimeDays: 7 });
      expect(await screen.findByText(LINK.url)).toBeInTheDocument();
      expect(notify.worked).toHaveBeenCalledWith('Added Alex.');
    });

    it('asks once however many times Add is pressed while it is asking', async () => {
      let answer: (outcome: object) => void = () => undefined;

      accountMocks.inviteAccount.mockReturnValue(
        new Promise((resolve) => {
          answer = resolve;
        }),
      );

      const user = userEvent.setup();
      renderInAnAddress(<AccountsPanel />);

      await openInvite(user);
      await user.type(screen.getByLabelText('Name'), 'Alex');

      const add = screen.getByRole('button', { name: 'Add' });

      await user.click(add);

      expect(add).toHaveAttribute('aria-busy', 'true');

      await user.click(add);

      expect(accountMocks.inviteAccount).toHaveBeenCalledTimes(1);

      answer({ kind: 'refused', refusal: { message: 'That email address is already in use.' } });

      expect(await screen.findByText('That email address is already in use.')).toBeInTheDocument();
    });

    it('keeps the link it just made to copy again from the list', async () => {
      const user = userEvent.setup();

      accountMocks.fetchAccounts.mockResolvedValue([
        ...ACCOUNTS,
        account({
          id: 'usr_3',
          name: 'Alex',
          username: 'alex',
          email: null,
          canSignIn: false,
          setup: { state: 'waiting', expiresAt: LINK.expiresAt },
        }),
      ]);

      renderInAnAddress(<AccountsPanel />);

      await openInvite(user);
      await user.type(screen.getByLabelText('Name'), 'Alex');
      await user.click(screen.getByRole('button', { name: 'Add' }));
      await user.click(await screen.findByRole('button', { name: 'Done' }));

      expect(await screen.findByRole('button', { name: /Copy link/ })).toBeInTheDocument();
    });
  });

  describe('setup links', () => {
    const WAITING = account({
      id: 'usr_3',
      name: 'Alex',
      username: 'alex',
      email: null,
      canSignIn: false,
      setup: { state: 'waiting', expiresAt: LINK.expiresAt },
    });

    it('says who is waiting for setup, and never shows a placeholder address', async () => {
      accountMocks.fetchAccounts.mockResolvedValue([...ACCOUNTS, WAITING]);

      renderInAnAddress(<AccountsPanel />);

      expect(await screen.findByText('Waiting for setup')).toBeInTheDocument();
      expect(screen.getByText('@alex')).toBeInTheDocument();
      expect(screen.queryByText(/no-email/)).not.toBeInTheDocument();
    });

    it('shows only those waiting when asked', async () => {
      accountMocks.fetchAccounts.mockResolvedValue([...ACCOUNTS, WAITING]);

      const user = userEvent.setup();
      renderInAnAddress(<AccountsPanel />);

      await user.click(await screen.findByRole('button', { name: 'Filter accounts' }));
      await user.click(await screen.findByRole('menuitemradio', { name: 'Waiting for setup (1)' }));

      expect(screen.getByText('Alex')).toBeInTheDocument();
      expect(screen.queryByText('Sam')).not.toBeInTheDocument();
    });

    it('offers a new link where the old one is not held, and shows it in the editor', async () => {
      accountMocks.fetchAccounts.mockResolvedValue([
        account({ ...WAITING, setup: { state: 'expired', expiresAt: '2026-01-01T00:00:00.000Z' } }),
      ]);

      const user = userEvent.setup();
      renderInAnAddress(<AccountsPanel />);

      expect(await screen.findByText('Link expired')).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: /New link/ }));

      expect(linkMocks.issueSetupLink).toHaveBeenCalledWith('usr_3', 7);
      expect(await screen.findByText(LINK.url)).toBeInTheDocument();
    });

    it('offers an account in use a link to choose a new password', async () => {
      const user = userEvent.setup();
      renderInAnAddress(<AccountsPanel />);

      await choose(user, 'Dan', /Send a setup link/);

      expect(linkMocks.issueSetupLink).toHaveBeenCalledWith('usr_1', 7);
    });

    it('emails a link only where the server sends them and the account has an address', async () => {
      linkMocks.canEmailSetupLinks = true;
      accountMocks.fetchAccounts.mockResolvedValue([...ACCOUNTS, WAITING]);

      const user = userEvent.setup();
      renderInAnAddress(<AccountsPanel />);

      await choose(user, 'Dan', /Send by email/);

      expect(linkMocks.emailSetupLink).toHaveBeenCalledWith('usr_1', { lifetimeDays: 7 });

      await user.click(await screen.findByRole('button', { name: 'Actions for Alex' }));

      expect(screen.queryByRole('menuitem', { name: /Send by email/ })).not.toBeInTheDocument();
    });
  });

  it('shows when each account last signed in', async () => {
    accountMocks.fetchAccounts.mockResolvedValue([account({ lastSignedInAt: null })]);

    renderInAnAddress(<AccountsPanel />);

    expect(await screen.findByText('never')).toBeInTheDocument();
  });

  it('changes a username from the editor', async () => {
    const user = userEvent.setup();
    renderInAnAddress(<AccountsPanel />);

    await choose(user, 'Dan', /Edit account/);

    const field = await screen.findByLabelText('Username');

    await user.clear(field);
    await user.type(field, 'daniel');
    await save(user);

    await waitFor(() => {
      expect(accountMocks.editAccount).toHaveBeenCalledWith('usr_1', { username: 'daniel' });
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
        message: 'You can’t do that to your own account.',
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

      expect(screen.getByRole('switch', { name: 'Give Dan the Member role' })).toBeChecked();
      expect(
        screen.getByRole('switch', { name: 'Give Dan the Administrator role' }),
      ).not.toBeChecked();
    });

    it('gives one they do not hold', async () => {
      const user = userEvent.setup();
      renderInAnAddress(<AccountsPanel />);

      await editRoles(user);
      await user.click(screen.getByRole('switch', { name: 'Give Dan the Administrator role' }));
      await save(user);

      await waitFor(() => {
        expect(mocks.assignRole).toHaveBeenCalledWith('usr_1', 'role_1');
      });
    });

    it('takes back one they do', async () => {
      const user = userEvent.setup();
      renderInAnAddress(<AccountsPanel />);

      await editRoles(user);
      await user.click(screen.getByRole('switch', { name: 'Give Dan the Member role' }));
      await save(user);

      await waitFor(() => {
        expect(mocks.removeRole).toHaveBeenCalledWith('usr_1', 'role_2');
      });
    });

    it('changes nothing until saved', async () => {
      const user = userEvent.setup();
      renderInAnAddress(<AccountsPanel />);

      await editRoles(user);
      await user.click(screen.getByRole('switch', { name: 'Give Dan the Administrator role' }));

      expect(mocks.assignRole).not.toHaveBeenCalled();
    });

    it('reads their permissions again once a change lands', async () => {
      const user = userEvent.setup();
      renderInAnAddress(<AccountsPanel />);

      await editRoles(user);
      await user.click(screen.getByRole('switch', { name: 'Give Dan the Administrator role' }));
      await save(user);

      await waitFor(() => {
        expect(mocks.fetchAccountPermissions).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('refusals', () => {
    it('explains one rather than reporting a failure', async () => {
      mocks.assignRole.mockResolvedValue({
        message: 'That role is equal to or higher than yours.',
      });

      const user = userEvent.setup();
      renderInAnAddress(<AccountsPanel />);

      await editRoles(user);
      await user.click(screen.getByRole('switch', { name: 'Give Dan the Administrator role' }));
      await save(user);

      expect(await screen.findByRole('alert')).toHaveTextContent('equal to or higher than yours');
    });

    it('explains a lockout the server refused', async () => {
      mocks.removeRole.mockResolvedValue({
        message: 'That would leave no administrators on this server.',
      });

      const user = userEvent.setup();
      renderInAnAddress(<AccountsPanel />);

      await editRoles(user);
      await user.click(screen.getByRole('switch', { name: 'Give Dan the Member role' }));
      await save(user);

      expect(await screen.findByRole('alert')).toHaveTextContent(
        'That would leave no administrators',
      );
    });

    it('says nothing when the server was happy', async () => {
      const user = userEvent.setup();
      renderInAnAddress(<AccountsPanel />);

      await editRoles(user);
      await user.click(screen.getByRole('switch', { name: 'Give Dan the Administrator role' }));
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

    expect(await screen.findByRole('button', { name: /Hide Films from Dan/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: /Hide Shows from Dan/ })).toBeInTheDocument();
  });

  it('says plainly that an untouched account sees everything', async () => {
    const user = userEvent.setup();

    renderInAnAddress(<AccountsPanel />);

    await edit(user, 'Libraries');

    expect(
      await screen.findByText(/Everything is allowed until you change it/i),
    ).toBeInTheDocument();
  });

  it('takes one away when asked', async () => {
    const user = userEvent.setup();

    renderInAnAddress(<AccountsPanel />);

    await edit(user, 'Libraries');
    await user.click(await screen.findByRole('button', { name: /Hide Films from Dan/ }));
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
    await user.click(await screen.findByRole('button', { name: /Give Dan access to Films/ }));
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

    expect(await screen.findByText(/can’t access any library/i)).toBeInTheDocument();
  });

  it('says nothing of the sort while they can still reach one', async () => {
    const user = userEvent.setup();

    renderInAnAddress(<AccountsPanel />);

    await edit(user, 'Libraries');
    await screen.findByRole('button', { name: /Hide Films from Dan/ });

    expect(screen.queryByText(/can’t access any library/i)).not.toBeInTheDocument();
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

    expect(await screen.findByText('No age limit')).toBeInTheDocument();
  });

  it('sets one for that library alone', async () => {
    const user = userEvent.setup();

    renderInAnAddress(<AccountsPanel />);

    await edit(user, 'Libraries');
    await user.click(
      await screen.findByRole('button', { name: /Age rating limit in Films for Dan/ }),
    );
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
    await user.click(
      await screen.findByRole('button', { name: /Age rating limit in Films for Dan/ }),
    );
    await user.click(await screen.findByRole('menuitemradio', { name: /No age limit/ }));
    await save(user);

    await waitFor(() => {
      expect(accessMocks.setCeiling).toHaveBeenCalledWith('usr_1', FILMS, null);
    });
  });

  it('offers the unrated escape only once a ceiling exists', async () => {
    const user = userEvent.setup();

    renderInAnAddress(<AccountsPanel />);

    await edit(user, 'Libraries');
    await screen.findByText('No age limit');

    expect(screen.queryByRole('button', { name: /Allow unrated titles/ })).not.toBeInTheDocument();
  });

  it('turns the unrated escape on without losing the ceiling', async () => {
    const user = userEvent.setup();

    accessMocks.fetchLibraryAccess.mockResolvedValue([
      { id: FILMS, name: 'Films', mayView: true, maximumAge: 15, allowsUnrated: false },
    ]);

    renderInAnAddress(<AccountsPanel />);

    await edit(user, 'Libraries');
    await user.click(await screen.findByRole('button', { name: /Allow unrated titles/ }));
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

    expect(await screen.findByText(/including every profile on it/i)).toBeInTheDocument();
    expect(await screen.findByText(/give the child their own account/i)).toBeInTheDocument();
  });

  it('says nothing of the sort while no limit is set', async () => {
    const user = userEvent.setup();

    renderInAnAddress(<AccountsPanel />);

    await edit(user, 'Libraries');
    await screen.findByText('No age limit');

    expect(screen.queryByText(/including every profile on it/i)).not.toBeInTheDocument();
  });
});
