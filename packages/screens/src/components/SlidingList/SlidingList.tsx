import { HoverHighlight } from '@ValenceUI/HoverHighlight';
import { useSlidingHighlight } from '@ValenceUI/useSlidingHighlight';
import type { SlidingListProps } from './SlidingList.types';

/**
 * A list of rows inside a dialog's panel — episodes, chapters — with one highlight that slides from
 * row to row under the pointer, as a menu's does, rather than each row lighting on its own. Rows are
 * parted by a hairline that spans exactly as wide as the highlight, so the highlight sits flush with
 * the lines around it, and their content lines up with the panel's heading.
 *
 * @param items - What to list, in order.
 * @param keyOf - What tells each item apart.
 * @param renderItem - Draws one row.
 * @param label - What the list is, for somebody who cannot see it.
 */
const SlidingList = <Item,>({ items, keyOf, renderItem, label }: SlidingListProps<Item>) => {
  const { containerRef, rect, follow, clear } = useSlidingHighlight();

  return (
    <div
      ref={containerRef}
      className="relative -mx-2"
      onPointerMove={follow}
      onPointerLeave={clear}
    >
      <HoverHighlight rect={rect} radius="card" />

      <ul
        {...(label === undefined ? {} : { 'aria-label': label })}
        className="relative flex flex-col"
      >
        {items.map((item) => (
          <li
            key={keyOf(item)}
            data-highlight={keyOf(item)}
            className="relative px-2 [&+&]:before:absolute [&+&]:before:inset-x-0 [&+&]:before:top-0 [&+&]:before:h-px [&+&]:before:bg-[var(--surface-line)]"
          >
            {renderItem(item)}
          </li>
        ))}
      </ul>
    </div>
  );
};

SlidingList.displayName = 'SlidingList';

export { SlidingList };
