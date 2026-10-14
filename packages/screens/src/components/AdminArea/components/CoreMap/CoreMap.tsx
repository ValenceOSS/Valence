import { FormattedNumber } from '@ValenceUI/FormattedNumber';
import { cn } from '@ValenceUI/cn';
import { threadsOnEachCore } from './threadsOnEachCore';
import type { CoreMapProps } from './CoreMap.types';
import { say } from '@ValenceI18n/say';

const BUSY_FROM = 50;

const STRAINED_FROM = 80;

/**
 * The fill a thread is drawn with: green while it has room, yellow once it is busy and red once it
 * is close to full, each fading from the bottom up.
 *
 * @param percent - How busy the thread is.
 * @returns The classes for its fill.
 */
const fillFor = (percent: number): string =>
  percent >= STRAINED_FROM
    ? 'border-danger from-danger/70 to-danger/20'
    : percent >= BUSY_FROM
      ? 'border-warning from-warning/70 to-warning/20'
      : 'border-success from-success/60 to-success/15';

/**
 * The processor drawn as it is built: a tile for each core, filled from the bottom as busy as each
 * of its threads is and saying how busy the core is as a whole, so a chip with fast and efficient
 * cores reads as two kinds of tile and a stuck thread stands out at a glance. The fill turns from
 * green to yellow to red as a thread fills up.
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
                  className={cn(
                    'absolute inset-x-0 bottom-0 border-t bg-linear-to-t transition-[height] duration-500 ease-out motion-reduce:transition-none',
                    percent === 0 ? 'border-transparent' : fillFor(percent),
                  )}
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
