import { useRef } from 'react';
import { Reorder, useDragControls } from 'motion/react';
import type { MovableRoleProps } from './MovableRole.types';

// oxlint-disable-next-line valence/no-hard-coded-strings -- a CSS selector, not words anyone reads
const MENU = '[data-role-menu]';

/**
 * One role the reader may move, dragged from anywhere on it but its menu; letting go of a drag does
 * not also count as pressing it.
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
        if (!(event.target instanceof Element && event.target.closest(MENU) !== null)) {
          controls.start(event);
        }
      }}
      onDragStart={() => {
        dragged.current = true;
      }}
      onDragEnd={onDragEnd}
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
