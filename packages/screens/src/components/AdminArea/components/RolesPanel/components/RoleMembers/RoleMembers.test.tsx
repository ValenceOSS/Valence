import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AccountSchema } from '@ValenceContracts/schemas/Account';
import type { Role } from '@ValenceContracts/schemas/Permission';
import { RoleMembers } from './RoleMembers';

const account = (changes: object) =>
  AccountSchema.parse({
    id: 'usr-1',
    name: 'Ada',
    email: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    isBanned: false,
    banReason: null,
    position: null,
    isAdministrator: false,
    face: null,
    roles: [],
    ...changes,
  });

const ACCOUNTS = [
  account({ id: 'ada', name: 'Ada', username: 'lovelace' }),
  account({ id: 'bo', name: 'Bo', email: 'bo@example.com' }),
  account({ id: 'cy', name: 'Cy' }),
];

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

const HOLDING = [
  account({ id: 'ada', name: 'Ada', username: 'lovelace', roles: ['Member', 'Moderator'] }),
  account({ id: 'bo', name: 'Bo', roles: [] }),
  account({ id: 'cy', name: 'Cy', roles: ['Member'] }),
];

/**
 * Finds the row of one account, by the switch it holds.
 *
 * @param name - The account's name.
 * @returns The row.
 */
const rowOf = (name: string): HTMLElement => {
  const row = screen
    .getAllByRole('listitem')
    .find((item) => within(item).queryByRole('switch', { name: `${name} has this role` }) !== null);

  if (row === undefined) {
    throw new Error(`No row holds ${name}.`);
  }

  return row;
};

describe('RoleMembers', () => {
  it('lists everybody by name and handle, with whether each holds the role', () => {
    render(<RoleMembers accounts={ACCOUNTS} heldIds={new Set(['bo'])} onToggle={vi.fn()} />);

    expect(screen.getByText('@lovelace')).toBeVisible();
    expect(screen.getByText('bo@example.com')).toBeVisible();
    expect(screen.getByRole('switch', { name: 'Bo has this role' })).toBeChecked();
    expect(screen.getByRole('switch', { name: 'Ada has this role' })).not.toBeChecked();
  });

  it('finds somebody by their username', async () => {
    render(<RoleMembers accounts={ACCOUNTS} heldIds={new Set()} onToggle={vi.fn()} />);

    await userEvent.type(screen.getByRole('searchbox', { name: 'Find someone' }), '@LOVE');

    expect(screen.getByText('Ada')).toBeVisible();
    expect(screen.queryByText('Bo')).not.toBeInTheDocument();
    expect(screen.queryByText('Cy')).not.toBeInTheDocument();
  });

  it('finds somebody by their address or their name', async () => {
    render(<RoleMembers accounts={ACCOUNTS} heldIds={new Set()} onToggle={vi.fn()} />);

    const search = screen.getByRole('searchbox', { name: 'Find someone' });

    await userEvent.type(search, 'example.com');

    expect(screen.getByText('Bo')).toBeVisible();
    expect(screen.queryByText('Ada')).not.toBeInTheDocument();

    await userEvent.clear(search);
    await userEvent.type(search, 'cy');

    expect(screen.getByText('Cy')).toBeVisible();
    expect(screen.queryByText('Bo')).not.toBeInTheDocument();
  });

  it('says when nobody matches', async () => {
    render(<RoleMembers accounts={ACCOUNTS} heldIds={new Set()} onToggle={vi.fn()} />);

    await userEvent.type(screen.getByRole('searchbox', { name: 'Find someone' }), 'zed');

    expect(screen.getByText('No one matches your search.')).toBeVisible();
  });

  it('flips somebody between holding the role and not', async () => {
    const onToggle = vi.fn();

    render(<RoleMembers accounts={ACCOUNTS} heldIds={new Set()} onToggle={onToggle} />);

    await userEvent.click(screen.getByRole('switch', { name: 'Cy has this role' }));

    expect(onToggle).toHaveBeenCalledWith('cy');
  });

  it('lists those holding the role first, and everyone else after', () => {
    render(<RoleMembers accounts={ACCOUNTS} heldIds={new Set(['cy'])} onToggle={vi.fn()} />);

    expect(screen.getAllByRole('heading').map((heading) => heading.textContent)).toEqual([
      '1 member',
      'Everyone else',
    ]);

    const toggles = screen.getAllByRole('switch');

    expect(toggles[0]).toHaveAccessibleName('Cy has this role');
    expect(toggles[1]).toHaveAccessibleName('Ada has this role');
    expect(toggles[2]).toHaveAccessibleName('Bo has this role');
  });

  it('leaves out a group with nobody in it', () => {
    render(<RoleMembers accounts={ACCOUNTS} heldIds={new Set()} onToggle={vi.fn()} />);

    expect(screen.queryByRole('heading', { name: '0 members' })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Everyone else' })).toBeInTheDocument();
  });

  it('names every role each account holds, highest first', () => {
    render(
      <RoleMembers
        accounts={HOLDING}
        heldIds={new Set()}
        roles={[MODERATOR, MEMBER]}
        onToggle={vi.fn()}
      />,
    );

    expect(rowOf('Ada')).toHaveTextContent(/Moderator.*Member/);
    expect(rowOf('Cy')).toHaveTextContent('Member');
    expect(rowOf('Bo')).not.toHaveTextContent(/Member|Moderator/);
  });

  it('names this role on each account as the draft stands, not as it was saved', () => {
    render(
      <RoleMembers
        accounts={HOLDING}
        heldIds={new Set(['ada', 'bo'])}
        roles={[MODERATOR, MEMBER]}
        roleId={MEMBER.id}
        onToggle={vi.fn()}
      />,
    );

    expect(rowOf('Bo')).toHaveTextContent('Member');
    expect(rowOf('Cy')).not.toHaveTextContent('Member');
    expect(rowOf('Ada')).toHaveTextContent(/Moderator.*Member/);
  });

  it('shuts the switch on anybody holding a role out of the reader’s reach', () => {
    render(
      <RoleMembers
        accounts={HOLDING}
        heldIds={new Set(['cy'])}
        roles={[MODERATOR, MEMBER]}
        roleId={MEMBER.id}
        outOfReach={new Set([MODERATOR.id])}
        onToggle={vi.fn()}
      />,
    );

    expect(screen.getByRole('switch', { name: 'Ada has this role' })).toBeDisabled();
    expect(rowOf('Ada')).toHaveTextContent('Above your role');
    expect(screen.getByRole('switch', { name: 'Bo has this role' })).toBeEnabled();
    expect(screen.getByRole('switch', { name: 'Cy has this role' })).toBeEnabled();
    expect(rowOf('Cy')).not.toHaveTextContent('Above your role');
  });

  it('sets a display name so devtools can identify it', () => {
    expect(RoleMembers.displayName).toBe('RoleMembers');
  });
});
