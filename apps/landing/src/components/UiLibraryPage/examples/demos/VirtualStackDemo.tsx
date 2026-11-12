import { VirtualStack } from '@ValenceUI/VirtualStack';

const HEIGHTS = [64, 112, 88, 144];

/**
 * A stack of blocks of differing heights that draws only those near the screen, as the front
 * page's shelves are, here with sixty plain blocks.
 */
const VirtualStackDemo = () => (
  <div className="w-full" aria-label="Sixty blocks">
    <VirtualStack
      count={60}
      keyOf={(index) => `block-${index.toString()}`}
      estimatedHeight={96}
      gap={12}
    >
      {(index) => (
        <div
          className="valence-surface flex items-center justify-center rounded-xl text-sm text-text-muted"
          style={{ height: HEIGHTS[index % HEIGHTS.length] }}
        >
          {(index + 1).toString()}
        </div>
      )}
    </VirtualStack>
  </div>
);

VirtualStackDemo.displayName = 'VirtualStackDemo';

export { VirtualStackDemo };
