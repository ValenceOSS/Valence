import { HoverHighlight } from '@ValenceUI/HoverHighlight';
import { useSlidingHighlight } from '@ValenceUI/useSlidingHighlight';

const ROWS = ['Arrival', 'Blade Runner 2049', 'Dune', 'Sicario'] as const;

/**
 * A short list with one highlight that slides from row to row under the pointer, as menus and lists
 * across Valence do.
 */
const HoverHighlightDemo = () => {
  const { containerRef, rect, follow, clear } = useSlidingHighlight();

  return (
    <div
      ref={containerRef}
      className="relative flex w-64 flex-col"
      onPointerMove={follow}
      onPointerLeave={clear}
    >
      <HoverHighlight rect={rect} radius="sm" />

      {ROWS.map((row) => (
        <span
          key={row}
          data-highlight={row}
          className="relative z-10 rounded-sm px-3 py-2 text-sm text-text"
        >
          {row}
        </span>
      ))}
    </div>
  );
};

HoverHighlightDemo.displayName = 'HoverHighlightDemo';

export { HoverHighlightDemo };
