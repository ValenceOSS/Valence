import { FormattedNumber } from '@ValenceUI/FormattedNumber';
import { threadsOnEachCore } from './threadsOnEachCore';
import type { CoreMapProps } from './CoreMap.types';
import { say } from '@ValenceI18n/say';

/**
 * The processor drawn as it is built: a tile for each core, filled from the bottom as busy as each
 * of its threads is and saying how busy the core is as a whole, so a chip with fast and efficient
 * cores reads as two kinds of tile and a stuck thread stands out at a glance.
 *
 * Threads are handed to cores in the order the system numbers them, which is how most chips with
 * two threads to a core lay them out.
 *
 * @param cores - Physical cores, or null where the platform would not count them.
 * @param threads - Logical processors.
 * @param percents - How busy each logical processor is, in the order the system numbers them.
 */
const CoreMap = ({ cores, threads, percents }: CoreMapProps) => {
  const layout = threadsOnEachCore(cores, threads);
  const firsts = layout.map((_, core) => layout.slice(0, core).reduce((sum, n) => sum + n, 0));

  return (
    <span
      role="img"
      aria-label={say('screens.adminArea.coreMap.label', {
        cores: (cores ?? threads).toLocaleString(),
        threads: threads.toLocaleString(),
      })}
      className="grid grid-cols-[repeat(auto-fill,minmax(2.75rem,1fr))] gap-1 px-2.5 py-1.5"
    >
      {layout.map((count, core) => {
        const own = Array.from({ length: count }, (_, thread) =>
          Math.min(100, Math.max(0, percents[(firsts[core] ?? 0) + thread] ?? 0)),
        );
        const busy = own.reduce((sum, percent) => sum + percent, 0) / Math.max(1, own.length);

        return (
          <span
            key={core}
            className="relative flex h-9 overflow-hidden rounded-md border border-[var(--surface-line)] bg-[var(--surface-hover)]"
          >
            {own.map((percent, thread) => (
              <span key={thread} className="relative flex-1">
                <span
                  className="absolute inset-x-0 bottom-0 bg-text/20 transition-[height] duration-500 ease-out motion-reduce:transition-none"
                  style={{ height: `${percent.toString()}%` }}
                />
              </span>
            ))}

            <span className="absolute inset-0 flex items-center justify-center text-[0.6875rem] font-semibold tabular-nums text-text">
              {percents.length === 0 ? (
                '—'
              ) : (
                <FormattedNumber value={Math.round(busy)} suffix="%" />
              )}
            </span>
          </span>
        );
      })}
    </span>
  );
};

CoreMap.displayName = 'CoreMap';

export { CoreMap };
