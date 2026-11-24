import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { Role } from '@ValenceContracts/schemas/Permission';
import { RoleList } from './RoleList';
import type { RoleListProps } from './RoleList.types';

const OWNER: Role = {
  id: 'role_0',
  name: 'Owner',
  position: 400,
  color: '#ff0000',
  permissions: ['administrator'],
};

const ADMINISTRATOR: Role = {
  id: 'role_1',
  name: 'Administrator',
  position: 300,
  color: null,
  permissions: ['administrator'],
};

const HELPER: Role = {
  id: 'role_3',
  name: 'Helper',
  position: 200,
  color: null,
  permissions: ['jobs.run'],
};

const MEMBER: Role = {
  id: 'role_2',
  name: 'Member',
  position: 100,
  color: null,
  permissions: ['sharing.link'],
};

const ROLES = [OWNER, ADMINISTRATOR, HELPER, MEMBER];

/**
 * Draws the list with every role in reach unless told otherwise.
 *
 * @param overrides - Anything about the list that matters to the test.
 * @returns The props it was drawn with.
 */
const draw = (overrides: Partial<RoleListProps> = {}): RoleListProps => {
  const props: RoleListProps = {
    roles: ROLES,
    outOfReach: new Set(),
    memberCounts: new Map([
      [OWNER.id, 1],
      [ADMINISTRATOR.id, 2],
      [MEMBER.id, 5],
    ]),
    chosenId: null,
    newRoleName: null,
    onChoose: vi.fn(),
    onReorder: vi.fn(),
    onDelete: vi.fn(),
    ...overrides,
  };

  render(<RoleList {...props} />);

  return props;
};

/**
 * Opens the menu of one role, the way a person does.
 *
 * @param name - The role's name.
 */
const openMenuOf = async (name: string) => {
  await userEvent.click(screen.getByRole('button', { name: `Actions for ${name}` }));
};

describe('RoleList', () => {
  it('lists every role highest first, each with how many hold it', () => {
    draw();

    const items = within(screen.getByRole('list', { name: 'Roles, highest first' })).getAllByRole(
      'listitem',
    );

    expect(items.map((item) => item.textContent)).toEqual([
      expect.stringContaining('Owner'),
      expect.stringContaining('Administrator'),
      expect.stringContaining('Helper'),
      expect.stringContaining('Member'),
    ]);
    expect(items[1]).toHaveTextContent('2 members');
    expect(items[2]).toHaveTextContent('0 members');
    expect(items[3]).toHaveTextContent('5 members');
  });

  it('marks the role that is open', () => {
    draw({ chosenId: HELPER.id });

    expect(screen.getByRole('button', { name: /^Helper/ })).toHaveAttribute('aria-current', 'true');
    expect(screen.getByRole('button', { name: /^Member/ })).not.toHaveAttribute('aria-current');
  });

  it('is told which role was pressed', async () => {
    const props = draw();

    await userEvent.click(screen.getByRole('button', { name: /^Member/ }));

    expect(props.onChoose).toHaveBeenCalledWith(MEMBER.id);
  });

  it('keeps roles out of reach at the top with a lock and no menu, but still opens them', async () => {
    const props = draw({ outOfReach: new Set([OWNER.id]) });

    const above = screen.getByRole('list', { name: 'Roles above yours' });

    expect(within(above).getByText('Owner')).toBeInTheDocument();
    expect(within(above).getByRole('img', { name: 'Above your role' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Actions for Owner' })).not.toBeInTheDocument();
    expect(
      within(screen.getByRole('list', { name: 'Roles, highest first' })).queryByText('Owner'),
    ).not.toBeInTheDocument();

    await userEvent.click(within(above).getByRole('button', { name: /Owner/ }));

    expect(props.onChoose).toHaveBeenCalledWith(OWNER.id);
  });

  it('draws no list of roles above the reader’s where none are', () => {
    draw();

    expect(screen.queryByRole('list', { name: 'Roles above yours' })).not.toBeInTheDocument();
  });

  it('moves a role up a place, keeping the roles out of reach on top', async () => {
    const props = draw({ outOfReach: new Set([OWNER.id]) });

    await openMenuOf('Member');
    await userEvent.click(await screen.findByRole('menuitem', { name: /Move up/ }));

    expect(props.onReorder).toHaveBeenCalledWith([
      OWNER.id,
      ADMINISTRATOR.id,
      MEMBER.id,
      HELPER.id,
    ]);
  });

  it('moves a role down a place', async () => {
    const props = draw();

    await openMenuOf('Administrator');
    await userEvent.click(await screen.findByRole('menuitem', { name: /Move down/ }));

    expect(props.onReorder).toHaveBeenCalledWith([
      OWNER.id,
      HELPER.id,
      ADMINISTRATOR.id,
      MEMBER.id,
    ]);
  });

  it('will not move the highest role it can move any higher', async () => {
    draw({ outOfReach: new Set([OWNER.id]) });

    await openMenuOf('Administrator');

    expect(await screen.findByRole('menuitem', { name: /Move up/ })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    expect(screen.getByRole('menuitem', { name: /Move down/ })).not.toHaveAttribute(
      'aria-disabled',
    );
  });

  it('will not move the lowest role any lower', async () => {
    draw();

    await openMenuOf('Member');

    expect(await screen.findByRole('menuitem', { name: /Move down/ })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
  });

  it('is told which role somebody asked to delete', async () => {
    const props = draw();

    await openMenuOf('Helper');
    await userEvent.click(await screen.findByRole('menuitem', { name: /Delete role/ }));

    expect(props.onDelete).toHaveBeenCalledWith(HELPER);
  });

  it('will not delete a role that grants everything, and says why', async () => {
    const props = draw();

    await openMenuOf('Administrator');

    const remove = await screen.findByRole('menuitem', { name: /Delete role/ });

    expect(remove).toHaveAttribute('aria-disabled', 'true');
    expect(remove).toHaveTextContent('Roles with every permission can’t be deleted');

    await userEvent.click(remove);

    expect(props.onDelete).not.toHaveBeenCalled();
  });

  it('shows a role being made at the foot of the list, chosen, with no menu', () => {
    draw({ newRoleName: 'New role', chosenId: 'new' });

    const made = screen.getByRole('button', { name: 'New role' });

    expect(made).toHaveAttribute('aria-current', 'true');
    expect(
      within(screen.getByRole('list', { name: 'Roles, highest first' })).queryByText('New role'),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Actions for New role' })).not.toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(RoleList.displayName).toBe('RoleList');
  });
});
