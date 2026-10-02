import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AccountSchema } from '@ValenceContracts/schemas/Account';
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

describe('RoleMembers', () => {
  it('lists everybody by name and handle, with whether each holds the role', () => {
    render(<RoleMembers accounts={ACCOUNTS} heldIds={new Set(['bo'])} onToggle={vi.fn()} />);

    expect(screen.getByText('@lovelace')).toBeVisible();
    expect(screen.getByText('bo@example.com')).toBeVisible();
    expect(screen.getByRole('switch', { name: 'Whether Bo holds this role' })).toBeChecked();
    expect(screen.getByRole('switch', { name: 'Whether Ada holds this role' })).not.toBeChecked();
  });

  it('finds somebody by their username', async () => {
    render(<RoleMembers accounts={ACCOUNTS} heldIds={new Set()} onToggle={vi.fn()} />);

    await userEvent.type(screen.getByRole('searchbox', { name: 'Find somebody' }), '@LOVE');

    expect(screen.getByText('Ada')).toBeVisible();
    expect(screen.queryByText('Bo')).not.toBeInTheDocument();
    expect(screen.queryByText('Cy')).not.toBeInTheDocument();
  });

  it('finds somebody by their address or their name', async () => {
    render(<RoleMembers accounts={ACCOUNTS} heldIds={new Set()} onToggle={vi.fn()} />);

    const search = screen.getByRole('searchbox', { name: 'Find somebody' });

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

    await userEvent.type(screen.getByRole('searchbox', { name: 'Find somebody' }), 'zed');

    expect(screen.getByText('Nobody here matches that.')).toBeVisible();
  });

  it('flips somebody between holding the role and not', async () => {
    const onToggle = vi.fn();

    render(<RoleMembers accounts={ACCOUNTS} heldIds={new Set()} onToggle={onToggle} />);

    await userEvent.click(screen.getByRole('switch', { name: 'Whether Cy holds this role' }));

    expect(onToggle).toHaveBeenCalledWith('cy');
  });
});
