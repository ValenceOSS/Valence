import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Reorder } from 'motion/react';
import { describe, expect, it, vi } from 'vitest';
import { Button } from '@ValenceUI/Button';
import type { Role } from '@ValenceContracts/schemas/Permission';
import { MovableRole } from './MovableRole';

const MEMBER: Role = {
  id: 'role_2',
  name: 'Member',
  position: 100,
  color: null,
  permissions: ['sharing.link'],
};

/**
 * Draws one movable role in a list of roles, as the role list does.
 *
 * @param onPress - Told when the role's face is pressed.
 * @param onDragEnd - Told once a drag lets go.
 * @returns Whatever `render` returns.
 */
const draw = (onPress = vi.fn(), onDragEnd = vi.fn()) =>
  render(
    <Reorder.Group as="ol" axis="y" values={[MEMBER.id]} onReorder={vi.fn()} aria-label="Roles">
      <MovableRole role={MEMBER} onDragEnd={onDragEnd}>
        <div>
          <Button variant="bare" size="none" onClick={onPress}>
            Member
          </Button>
          <span data-role-menu>
            <Button variant="bare" size="none" onClick={vi.fn()}>
              Actions for Member
            </Button>
          </span>
        </div>
      </MovableRole>
    </Reorder.Group>,
  );

describe('MovableRole', () => {
  it('stands as one item of the list of roles, holding its face', () => {
    draw();

    const item = within(screen.getByRole('list', { name: 'Roles' })).getByRole('listitem');

    expect(item).toContainElement(screen.getByRole('button', { name: 'Member' }));
  });

  it('lets a press that is not a drag through to its face', async () => {
    const onPress = vi.fn();
    const onDragEnd = vi.fn();

    draw(onPress, onDragEnd);

    await userEvent.click(screen.getByRole('button', { name: 'Member' }));

    expect(onPress).toHaveBeenCalledTimes(1);
    expect(onDragEnd).not.toHaveBeenCalled();
  });

  it('lets its menu be pressed without starting a drag', async () => {
    const onDragEnd = vi.fn();

    draw(vi.fn(), onDragEnd);

    await userEvent.click(screen.getByRole('button', { name: 'Actions for Member' }));

    expect(onDragEnd).not.toHaveBeenCalled();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(MovableRole.displayName).toBe('MovableRole');
  });
});
