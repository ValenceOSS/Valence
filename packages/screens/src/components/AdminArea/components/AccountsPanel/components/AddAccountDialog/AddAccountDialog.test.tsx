import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { inviteAccount } from '@ValenceClient/admin/fetchAccounts';
import { emailSetupLink } from '@ValenceClient/admin/emailSetupLink';
import { AccountSchema } from '@ValenceContracts/schemas/Account';
import { AddAccountDialog } from './AddAccountDialog';

vi.mock('@ValenceClient/admin/fetchAccounts', () => ({ inviteAccount: vi.fn() }));
vi.mock('@ValenceClient/admin/emailSetupLink', () => ({ emailSetupLink: vi.fn() }));
vi.mock('@ValenceClient/admin/isUsernameAvailable', () => ({
  isUsernameAvailable: () => Promise.resolve(true),
}));

const ACCOUNT = AccountSchema.parse({
  id: 'usr-new',
  name: 'Ada',
  username: 'ada',
  email: 'ada@example.com',
  createdAt: '2026-10-02T00:00:00.000Z',
  isBanned: false,
  banReason: null,
  position: null,
  isAdministrator: false,
  face: null,
  roles: ['Member'],
  canSignIn: false,
  setup: { state: 'waiting', expiresAt: '2026-10-09T00:00:00.000Z' },
});

const LINK = { url: 'https://valence.example/welcome/abc', expiresAt: '2026-10-09T00:00:00.000Z' };

/**
 * Draws the dialog open, with what it tells its caller standing in.
 *
 * @param canEmailSetupLinks - Whether the server sends setup links by email.
 * @returns What it tells its caller.
 */
const open = (canEmailSetupLinks = false) => {
  const told = { onClose: vi.fn(), onAdded: vi.fn(), onEdit: vi.fn() };

  render(<AddAccountDialog isOpen canEmailSetupLinks={canEmailSetupLinks} {...told} />);

  return told;
};

beforeEach(() => {
  vi.mocked(inviteAccount).mockReset();
  vi.mocked(emailSetupLink).mockReset();
});

describe('AddAccountDialog', () => {
  it('adds an account with only a name and shows its setup link', async () => {
    vi.mocked(inviteAccount).mockResolvedValue({
      kind: 'added',
      added: { account: ACCOUNT, setupLink: LINK },
    });

    const told = open();

    await userEvent.type(screen.getByLabelText('Name'), 'Ada');
    await userEvent.click(screen.getByRole('button', { name: '30 days' }));
    await userEvent.click(screen.getByRole('button', { name: 'Add' }));

    expect(inviteAccount).toHaveBeenCalledWith({ name: 'Ada', lifetimeDays: 30 });
    expect(told.onAdded).toHaveBeenCalled();
    expect(await screen.findByText(LINK.url)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Send by email/ })).not.toBeInTheDocument();
  });

  it('cannot add an account without a name', () => {
    open();

    expect(screen.getByRole('button', { name: 'Add' })).toBeDisabled();
  });

  it('sends a password instead of a link when one is chosen, and closes', async () => {
    vi.mocked(inviteAccount).mockResolvedValue({
      kind: 'added',
      added: { account: ACCOUNT, setupLink: null },
    });

    const told = open();

    await userEvent.type(screen.getByLabelText('Name'), 'Ada');
    await userEvent.type(screen.getByLabelText('Email (optional)'), 'ada@example.com');
    await userEvent.click(screen.getByRole('button', { name: 'Give them a password' }));

    expect(screen.getByRole('button', { name: 'Add' })).toBeDisabled();

    await userEvent.type(screen.getByLabelText('Password'), 'a-long-enough-password');
    await userEvent.click(screen.getByRole('button', { name: 'Add' }));

    expect(inviteAccount).toHaveBeenCalledWith({
      name: 'Ada',
      email: 'ada@example.com',
      password: 'a-long-enough-password',
    });
    expect(told.onClose).toHaveBeenCalled();
  });

  it('says why an account was refused and keeps what was typed', async () => {
    vi.mocked(inviteAccount).mockResolvedValue({
      kind: 'refused',
      refusal: { message: 'That username is already in use.' },
    });

    open();

    await userEvent.type(screen.getByLabelText('Name'), 'Ada');
    await userEvent.type(screen.getByLabelText('Username (optional)'), 'sam');
    await userEvent.click(screen.getByRole('button', { name: 'Add' }));

    expect(await screen.findByText('That username is already in use.')).toBeInTheDocument();
    expect(screen.getByLabelText('Name')).toHaveValue('Ada');
  });

  it('emails the link just made where the server can', async () => {
    vi.mocked(inviteAccount).mockResolvedValue({
      kind: 'added',
      added: { account: ACCOUNT, setupLink: LINK },
    });
    vi.mocked(emailSetupLink).mockResolvedValue({ kind: 'answered', value: LINK });

    open(true);

    await userEvent.type(screen.getByLabelText('Name'), 'Ada');
    await userEvent.click(screen.getByRole('button', { name: 'Add' }));
    await userEvent.click(await screen.findByRole('button', { name: /Send by email/ }));

    expect(emailSetupLink).toHaveBeenCalledWith('usr-new', { held: LINK });
  });

  it('goes straight to the editor for the account just added', async () => {
    vi.mocked(inviteAccount).mockResolvedValue({
      kind: 'added',
      added: { account: ACCOUNT, setupLink: LINK },
    });

    const told = open();

    await userEvent.type(screen.getByLabelText('Name'), 'Ada');
    await userEvent.click(screen.getByRole('button', { name: 'Add' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Edit account' }));

    expect(told.onEdit).toHaveBeenCalledWith('usr-new');
  });
});
