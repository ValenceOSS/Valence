import { motion, useReducedMotionConfig } from 'motion/react';
import { cn } from '@ValenceUI/cn';

const TONES = [
  'from-accent/70 via-accent/25 to-surface',
  'from-success/60 via-success/20 to-surface',
  'from-highlight/70 via-highlight/25 to-surface',
  'from-danger/55 via-danger/20 to-surface',
  'from-busy/60 via-busy/20 to-surface',
  'from-text/35 via-text/10 to-surface',
] as const;

const ROWS = [
  { count: 9, offset: 0, seconds: 70, direction: -1 },
  { count: 9, offset: 3, seconds: 85, direction: 1 },
] as const;

const TITLE_WIDTHS = ['w-3/4', 'w-1/2', 'w-2/3', 'w-4/5', 'w-3/5'] as const;

/**
 * Two rows of empty posters drifting slowly past each other, the shelves a library fills once it is
 * read. Purely a picture: it says nothing to assistive technology, and holds still for somebody who
 * asked for less movement.
 */
const PosterDrift = () => {
  const prefersReducedMotion = useReducedMotionConfig();
  const isStill = prefersReducedMotion === true;

  return (
    <div
      aria-hidden
      className="pointer-events-none flex select-none flex-col gap-3 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]"
    >
      {ROWS.map((row) => {
        const posters = Array.from(
          { length: row.count },
          (_, at) => (at + row.offset) % TONES.length,
        );
        const strip = [...posters, ...posters];

        return (
          <motion.div
            key={row.offset}
            className="flex w-max gap-3"
            initial={{ x: row.direction === 1 ? '-50%' : '0%' }}
            {...(isStill ? {} : { animate: { x: row.direction === 1 ? '0%' : '-50%' } })}
            transition={{ duration: row.seconds, ease: 'linear', repeat: Infinity }}
          >
            {strip.map((tone, at) => (
              <span
                key={at}
                className={cn(
                  'relative flex aspect-[2/3] w-24 shrink-0 flex-col justify-end overflow-hidden rounded-lg bg-gradient-to-b p-2.5 ring-1 ring-inset ring-[var(--surface-line)] sm:w-28',
                  TONES[tone],
                )}
              >
                <span className="absolute inset-0 bg-gradient-to-br from-text/10 via-transparent to-transparent" />
                <span
                  className={cn(
                    'relative h-1.5 rounded-full bg-text/25',
                    TITLE_WIDTHS[at % TITLE_WIDTHS.length],
                  )}
                />
                <span className="relative mt-1.5 h-1 w-1/3 rounded-full bg-text/15" />
              </span>
            ))}
          </motion.div>
        );
      })}
    </div>
  );
};

PosterDrift.displayName = 'PosterDrift';

export { PosterDrift };
