import { VirtualStrip } from '@ValenceUI/VirtualStrip';

/**
 * A long list drawn only as far as it is scrolled, the way lyrics and long queues are: a thousand
 * lines, of which only those on screen exist.
 */
const VirtualStripDemo = () => (
  <div className="h-64 w-full max-w-sm overflow-hidden rounded-xl border border-[var(--surface-line)]">
    <VirtualStrip label="A thousand lines" count={1000} estimateSize={40}>
      {(index) => (
        <p className="flex h-10 items-center px-4 text-sm text-text">
          Line {(index + 1).toString()}
        </p>
      )}
    </VirtualStrip>
  </div>
);

VirtualStripDemo.displayName = 'VirtualStripDemo';

export { VirtualStripDemo };
