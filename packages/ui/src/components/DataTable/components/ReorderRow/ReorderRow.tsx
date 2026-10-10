import { Reorder, useDragControls } from 'motion/react';
import type { ReorderRowProps } from './ReorderRow.types';

const CONTROLS = 'button, a, input, select, textarea, [role="combobox"], [role="switch"]';

/**
 * A top-level row of a table that may be dragged into a new order: picked up from anywhere on it
 * but its own controls, so pressing a button or opening a menu in the row does what it says rather
 * than starting a drag. A table that cannot be reordered keeps its rows still, rather than letting
 * them slide into place as it appears.
 *
 * @param id - The row's id, which the order is made of.
 * @param isReordering - Whether the table can be reordered at all.
 * @param depth - How deep the row sits, for the table's own styling.
 * @param onDragEnd - Told once a drag lets go.
 * @param onClick - Told when the row itself is pressed.
 * @param className - Extra classes for the row.
 * @param children - The row's cells.
 */
const ReorderRow = ({
  id,
  isReordering,
  depth,
  onDragEnd,
  onClick,
  className,
  children,
}: ReorderRowProps) => {
  const controls = useDragControls();

  if (!isReordering) {
    return (
      <tr
        data-highlight={id}
        data-depth={depth}
        {...(onClick === undefined ? {} : { onClick })}
        {...(className === undefined ? {} : { className })}
      >
        {children}
      </tr>
    );
  }

  return (
    <Reorder.Item
      as="tr"
      value={id}
      drag="y"
      dragListener={false}
      dragControls={controls}
      layout="position"
      onPointerDown={(event) => {
        if (!(event.target instanceof Element && event.target.closest(CONTROLS) !== null)) {
          controls.start(event);
        }
      }}
      onDragEnd={onDragEnd}
      data-highlight={id}
      data-depth={depth}
      {...(onClick === undefined ? {} : { onClick })}
      {...(className === undefined ? {} : { className })}
    >
      {children}
    </Reorder.Item>
  );
};

ReorderRow.displayName = 'ReorderRow';

export { ReorderRow };
