import { threadsOnEachCore } from './threadsOnEachCore';
import type { CoreMapProps } from './CoreMap.types';
import { say } from '@ValenceI18n/say';

/**
 * The processor drawn as it is built: a tile for each core, holding a dot for each thread it runs,
 * so a chip with fast and efficient cores reads as two kinds of tile at a glance.
 *
 * @param cores - Physical cores, or null where the platform would not count them.
 * @param threads - Logical processors.
 */
const CoreMap = ({ cores, threads }: CoreMapProps) => (
  <span
    role="img"
    aria-label={say('screens.adminArea.coreMap.label', {
      cores: (cores ?? threads).toLocaleString(),
      threads: threads.toLocaleString(),
    })}
    className="grid grid-cols-[repeat(auto-fill,minmax(1.75rem,1fr))] gap-1 px-2.5 py-1.5"
  >
    {threadsOnEachCore(cores, threads).map((count, core) => (
      <span
        key={core}
        className="flex h-5 items-center justify-center gap-1 rounded-md border border-[var(--surface-line)] bg-[var(--surface-hover)]"
      >
        {Array.from({ length: count }, (_, thread) => (
          <span key={thread} className="size-1.5 rounded-full bg-text-muted" />
        ))}
      </span>
    ))}
  </span>
);

CoreMap.displayName = 'CoreMap';

export { CoreMap };
