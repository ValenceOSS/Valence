import { VirtualGrid } from '@ValenceUI/VirtualGrid';

/**
 * A grid that draws only the rows on screen as the page scrolls, as the library's pages do, here
 * with a hundred plain cards.
 */
const VirtualGridDemo = () => (
  <div className="w-full">
    <VirtualGrid label="A hundred cards" count={100} leastCardWidth={120} rowHeight={80} gap={12}>
      {(index) => (
        <div className="valence-surface flex h-full items-center justify-center rounded-xl text-sm text-text-muted">
          {(index + 1).toString()}
        </div>
      )}
    </VirtualGrid>
  </div>
);

VirtualGridDemo.displayName = 'VirtualGridDemo';

export { VirtualGridDemo };
