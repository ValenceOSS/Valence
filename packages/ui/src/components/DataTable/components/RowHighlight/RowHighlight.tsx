import { useEffect } from 'react';
import { HoverHighlight } from '@ValenceUI/HoverHighlight';
import { useSlidingHighlight } from '@ValenceUI/useSlidingHighlight';
import type { RowHighlightProps } from './RowHighlight.types';

/**
 * The background that follows the pointer down a table's rows, listening to the table's scrolling
 * box itself so that moving between rows redraws only the highlight and never the rows.
 *
 * @param containerRef - The table's scrolling box.
 */
const RowHighlight = ({ containerRef }: RowHighlightProps) => {
  const { rect, follow, clear } = useSlidingHighlight(containerRef);

  useEffect(() => {
    const box = containerRef.current;

    if (box === null) {
      return undefined;
    }

    box.addEventListener('pointermove', follow);
    box.addEventListener('pointerleave', clear);

    return () => {
      box.removeEventListener('pointermove', follow);
      box.removeEventListener('pointerleave', clear);
    };
  }, [containerRef, follow, clear]);

  return <HoverHighlight rect={rect} radius="none" />;
};

RowHighlight.displayName = 'RowHighlight';

export { RowHighlight };
