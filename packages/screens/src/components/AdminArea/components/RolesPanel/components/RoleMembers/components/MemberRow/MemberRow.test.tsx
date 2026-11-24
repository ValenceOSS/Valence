import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AccountSchema } from '@ValenceContracts/schemas/Account';
import type { Role } from '@ValenceContracts/schemas/Permission';
import { MemberRow } from './MemberRow';

const ADA = AccountSchema.parse({
  id: 'ada',
  name: 'Ada',
  username: 'lovelace',
  email: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  isBanned: false,
  banReason: null,
  position: null,
  isAdministrator: false,
  face: null,
  roles: ['Moderator', 'Member'],
});

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

/**
 * Draws one row in a list, as the role's members are drawn.
 *
 * @param changes - Anything about the row that matters to the test.
 * @returns The toggle it was drawn with.
 */
const draw = (changes: { isHeld?: boolean; isLocked?: boolean; heldRoles?: Role[] } = {}) => {
  const onToggle = vi.fn();

  render(
    <ul>
      <MemberRow
        account={ADA}
        isHeld={changes.isHeld ?? false}
        heldRoles={changes.heldRoles ?? [MODERATOR, MEMBER]}
        isLocked={changes.isLocked ?? false}
        onToggle={onToggle}
      />
    </ul>,
  );

  return onToggle;
};

describe('MemberRow', () => {
  it('shows the account by its initial, name and handle', () => {
    draw();

    expect(screen.getByText('A')).toBeInTheDocument();
    expect(screen.getByText('Ada')).toBeInTheDocument();
    expect(screen.getByText('@lovelace')).toBeInTheDocument();
  });

  it('names every role the account holds, in the order given', () => {
    draw();

    const row = screen.getByRole('listitem');

    expect(row).toHaveTextContent(/Moderator.*Member/);
  });

  it('says whether the account holds the role, and flips it when pressed', async () => {
    const onToggle = draw({ isHeld: true });

    const toggle = screen.getByRole('switch', { name: 'Ada has this role' });

    expect(toggle).toBeChecked();

    await userEvent.click(toggle);

    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('shuts the switch on an account above the reader, and says why', async () => {
    const onToggle = draw({ isLocked: true });

    const toggle = screen.getByRole('switch', { name: 'Ada has this role' });

    expect(toggle).toBeDisabled();
    expect(screen.getByText('@lovelace · Above your role')).toBeInTheDocument();

    await userEvent.click(toggle);

    expect(onToggle).not.toHaveBeenCalled();
  });

  it('names no roles for an account that holds none', () => {
    draw({ heldRoles: [] });

    expect(screen.getByRole('listitem')).not.toHaveTextContent('Member');
  });

  it('sets a display name so devtools can identify it', () => {
    expect(MemberRow.displayName).toBe('MemberRow');
  });
});
