import { useRef } from 'react';
import { Reorder, useDragControls } from 'motion/react';
import type { MovableRoleProps } from './MovableRole.types';

// oxlint-disable-next-line valence/no-hard-coded-strings -- a CSS selector, not words anyone reads
const MENU = '[data-role-menu]';

// oxlint-disable-next-line valence/no-hard-coded-strings -- a CSS selector, not words anyone reads
const GRIP = '[data-role-grip]';

/**
 * One role the reader may move, dragged from anywhere on it but its menu, or by its grip alone on a
 * touch screen so the list still scrolls; letting go of a drag does not also count as pressing it.
 *
 * @param role - The role.
 * @param onDragEnd - Told once a drag lets go.
 * @param children - Its face.
 */
const MovableRole = ({ role, onDragEnd, children }: MovableRoleProps) => {
  const controls = useDragControls();
  const dragged = useRef(false);

  return (
    <Reorder.Item
      as="li"
      value={role.id}
      drag="y"
      dragListener={false}
      dragControls={controls}
      layout="position"
      onPointerDown={(event) => {
        const target = event.target instanceof Element ? event.target : null;
        const isOnMenu = (target?.closest(MENU) ?? null) !== null;
        const isScrollingByTouch =
          event.pointerType === 'touch' && (target?.closest(GRIP) ?? null) === null;

        if (!isOnMenu && !isScrollingByTouch) {
          controls.start(event);
        }
      }}
      onDragStart={() => {
        dragged.current = true;
      }}
      onDragEnd={() => {
        onDragEnd();
        setTimeout(() => {
          dragged.current = false;
        }, 0);
      }}
      onClickCapture={(event) => {
        if (dragged.current) {
          dragged.current = false;
          event.stopPropagation();
        }
      }}
      className="relative cursor-grab list-none active:cursor-grabbing"
    >
      {children}
    </Reorder.Item>
  );
};

MovableRole.displayName = 'MovableRole';

export { MovableRole };
