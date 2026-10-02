import { useRef, useState } from 'react';
import { motion, useReducedMotionConfig } from 'motion/react';
import { cn } from '@ValenceUI/cn';
import { FACE_PX, FANNED_LIFT_PX, placeFaces } from '@ValenceUI/placeFaces';
import { Tooltip } from '@ValenceUI/Tooltip';
import { useFitWidth } from '@ValenceUI/useFitWidth';
import type { SharedTimelineProps } from './SharedTimeline.types';

const SECONDS_BETWEEN_REPORTS = 1;

const FACE_ABOVE_BAR_PX = 12;

const REACHES_ABOVE_BAR_PX = FACE_ABOVE_BAR_PX + FACE_PX + FANNED_LIFT_PX + 4;

/**
 * How far along one title is, as a share of the bar.
 *
 * @param seconds - Where along it.
 * @param durationSeconds - How long it is.
 * @returns The fraction of the way along, as a percentage that stays on the bar.
 */
const percentAlong = (seconds: number, durationSeconds: number): string =>
  `${(Math.min(Math.max(seconds / Math.max(durationSeconds, 1), 0), 1) * 100).toString()}%`;

/**
 * One bar for a title several people are watching or listening to together, with each of their
 * faces at the point they have reached, filled to whoever keeps time, and the time along and the
 * time in all beneath it.
 *
 * People at about the same point overlap around it like circles in a Venn diagram, and the group
 * fans outwards and upwards when it is pointed at, so every face can be seen. Somebody who drifts
 * far enough away moves out to their own point and rises a little above the line. Faces glide
 * between the reports, which arrive about a second apart, rather than jumping, and spring open and
 * shut.
 *
 * What counts as pointing at a group is the space its faces take once fanned, worked out from
 * where the pointer is rather than from the faces themselves: they move as they open, and a pointer
 * they slid out from under would shut them again, back under the pointer, over and over.
 * Faces are not controls: pressing one does nothing, so each is a picture named for a screen
 * reader, with its name, position and drift in a tooltip for the pointer.
 *
 * @param label - What the bar is, read by assistive technology.
 * @param durationSeconds - How long the title is.
 * @param inSyncSeconds - How far apart two people can be and still keep their order in a group.
 * @param filledSeconds - How far the bar fills, which is wherever the party keeps time.
 * @param people - Everybody on it, with the face to draw and what their tooltip says.
 * @param elapsed - The time along, as the caller writes it.
 * @param total - The time in all, as the caller writes it.
 * @param status - What to show between the two times, such as whether everybody is together.
 * @param className - Extra classes for the caller's own layout.
 * @returns The timeline.
 */
const SharedTimeline = ({
  label,
  durationSeconds,
  inSyncSeconds = 0,
  filledSeconds,
  people,
  elapsed,
  total,
  status,
  className,
}: SharedTimelineProps) => {
  const prefersReducedMotion = useReducedMotionConfig();
  const bar = useRef<HTMLDivElement>(null);
  const width = useFitWidth(bar);
  const [fanned, setFanned] = useState<string | null>(null);
  const { faces: placed, groups } = placeFaces(
    people,
    durationSeconds,
    width ?? 0,
    fanned,
    inSyncSeconds,
  );
  const groupUnder = (clientX: number, clientY: number): string | null => {
    const box = bar.current?.getBoundingClientRect();

    if (box === undefined) {
      return null;
    }

    const x = clientX - box.left;
    const above = box.top - clientY;

    if (above < -4 || above > REACHES_ABOVE_BAR_PX) {
      return null;
    }

    return (
      groups.find((group) => group.size > 1 && Math.abs(x - group.x) <= group.reach)?.key ?? null
    );
  };
  const glide = {
    duration: prefersReducedMotion === true ? 0 : SECONDS_BETWEEN_REPORTS,
    ease: 'linear' as const,
  };
  const rise =
    prefersReducedMotion === true
      ? { duration: 0 }
      : { type: 'spring' as const, stiffness: 260, damping: 24 };

  return (
    <div role="group" aria-label={label} className={cn('flex flex-col gap-2', className)}>
      <div
        className="-mt-4 pt-16"
        data-fanned={fanned ?? ''}
        onPointerMove={(event) => {
          setFanned(groupUnder(event.clientX, event.clientY));
        }}
        onPointerLeave={() => {
          setFanned(null);
        }}
      >
        <div ref={bar} className="relative h-1 w-full rounded-full bg-track">
          <motion.span
            className="absolute inset-y-0 left-0 rounded-full bg-primary"
            initial={false}
            animate={{ width: percentAlong(filledSeconds, durationSeconds) }}
            transition={glide}
          />
          {people.map((person, index) => {
            const place = placed[index];

            return (
              <motion.span
                key={person.id}
                className="absolute bottom-3 -translate-x-1/2"
                style={{ zIndex: people.length - index }}
                initial={false}
                animate={{
                  left:
                    width === null || width === 0 || place === undefined
                      ? percentAlong(person.atSeconds, durationSeconds)
                      : `${place.x.toString()}px`,
                  x: width === null || width === 0 ? 0 : (place?.offset ?? 0),
                  y: -(place?.lift ?? 0),
                }}
                transition={{ left: glide, x: rise, y: rise }}
              >
                <Tooltip label={person.label}>
                  <span
                    role="img"
                    aria-label={person.label}
                    className="block rounded-full ring-2 ring-surface-raised"
                  >
                    {person.face}
                  </span>
                </Tooltip>
              </motion.span>
            );
          })}
        </div>
      </div>
      <div className="flex items-center justify-between gap-2 text-xs tabular-nums text-text-muted">
        <span>{elapsed}</span>
        {status}
        <span>{total}</span>
      </div>
    </div>
  );
};

SharedTimeline.displayName = 'SharedTimeline';

export { SharedTimeline };
