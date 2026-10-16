import { FormattedNumber } from '@ValenceUI/FormattedNumber';
import { LiquidFill } from '@ValenceUI/LiquidFill';
import type { LiquidTone } from '@ValenceUI/LiquidFill.types';
import { threadsOnEachCore } from './threadsOnEachCore';
import type { CoreMapProps } from './CoreMap.types';
import { say } from '@ValenceI18n/say';

const BUSY_FROM = 50;

const STRAINED_FROM = 80;

/**
 * Which colour a thread's liquid is: green while it has room, yellow once it is busy and red once
 * it is close to full.
 *
 * @param percent - How busy the thread is.
 * @returns The tone.
 */
const toneFor = (percent: number): LiquidTone =>
  percent >= STRAINED_FROM ? 'danger' : percent >= BUSY_FROM ? 'warning' : 'success';

/**
 * The processor drawn as it is built: a tile for each core, filled from the bottom as busy as each
 * of its threads is and saying how busy the core is as a whole. The fill turns from green to yellow
 * to red as a thread fills up, and it is drawn as liquid that ripples and sloshes.
 *
 * Where the machine says which kind each core is — the performance and efficiency cores of a hybrid
 * chip, or a Mac's levels — each kind is its own labelled group, and each thread is drawn on the
 * core the system says it runs on. Where it does not, threads are handed to cores in the order the
 * system numbers them.
 *
 * @param cores - Physical cores, or null where the platform would not count them.
 * @param threads - Logical processors.
 * @param groups - The cores grouped by kind, each as the logical processors on it.
 * @param percents - How busy each logical processor is, in the order the system numbers them.
 */
const CoreMap = ({ cores, threads, groups, percents }: CoreMapProps) => {
  const sequential = threadsOnEachCore(cores, threads);
  const drawn =
    groups.length > 0
      ? groups.map((group) => ({
          label:
            group.name ??
            (group.kind === 'performance'
              ? say('screens.adminArea.coreMap.performance')
              : group.kind === 'efficiency'
                ? say('screens.adminArea.coreMap.efficiency')
                : say('screens.adminArea.hardware.cores')),
          cores: group.cores,
        }))
      : [
          {
            label: say('screens.adminArea.hardware.cores'),
            cores: sequential.map((count, core) => {
              const first = sequential.slice(0, core).reduce((sum, n) => sum + n, 0);

              return Array.from({ length: count }, (_, thread) => first + thread);
            }),
          },
        ];

  return (
    <span
      role="img"
      aria-label={say('screens.adminArea.coreMap.label', {
        cores: (cores ?? threads).toLocaleString(),
        threads: threads.toLocaleString(),
      })}
      className="mt-1 flex flex-col"
    >
      {drawn.map((group) => (
        <span
          key={group.label}
          className="flex flex-col gap-2 border-t border-[var(--surface-line)] px-2.5 py-2.5"
        >
          {drawn.length > 1 ? (
            <span className="text-xs font-medium uppercase tracking-wide text-text-muted">
              {group.label}
            </span>
          ) : null}

          <span className="grid grid-cols-[repeat(auto-fill,minmax(2.75rem,1fr))] gap-1.5">
            {group.cores.map((logical) => {
              const own = logical.map((cpu) => Math.min(100, Math.max(0, percents[cpu] ?? 0)));
              const busy = own.reduce((sum, percent) => sum + percent, 0) / Math.max(1, own.length);

              return (
                <span
                  key={logical.join('-')}
                  className="relative flex h-9 overflow-hidden rounded-md border border-[var(--surface-line)] bg-[var(--surface-hover)]"
                >
                  {own.map((percent, thread) => (
                    <span key={logical[thread]} className="relative flex-1">
                      <LiquidFill level={percent / 100} tone={toneFor(percent)} />
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
        </span>
      ))}
    </span>
  );
};

CoreMap.displayName = 'CoreMap';

export { CoreMap };
