import { useEffect, useLayoutEffect, useRef } from 'react';
import { animate, useMotionValue, useReducedMotionConfig } from 'motion/react';
import { cn } from '@ValenceUI/cn';
import type { StatusRingProps } from './StatusRing.types';

const SETTLE = { type: 'spring', duration: 0.3, bounce: 0 } as const;

const MORPH = { duration: 0.3, ease: [0.77, 0, 0.175, 1] } as const;

const CHECK = 'M7.5 12.25 10.5 15.25 16.75 8.75';

const CROSS = 'M8.5 8.5 15.5 15.5M15.5 8.5 8.5 15.5';

const IDLE_DASH = 0.3;

const STROKE = 'fill-none stroke-current [stroke-linecap:round] [stroke-linejoin:round]';

const DRAWN = [
  '[stroke-dasharray:1_2] [stroke-dashoffset:1.05] opacity-0',
  '[transition:stroke-dashoffset_160ms_cubic-bezier(0.23,1,0.32,1),opacity_0ms_linear_160ms]',
  'still:[stroke-dashoffset:0] still:[transition:opacity_200ms_ease]',
].join(' ');

const TICK_IN = [
  'group-data-[status=done]:[stroke-dashoffset:0] group-data-[status=done]:opacity-100',
  'group-data-[status=done]:[transition:stroke-dashoffset_240ms_cubic-bezier(0.23,1,0.32,1)_120ms,opacity_0ms_linear_120ms]',
  'still:group-data-[status=done]:[transition:opacity_200ms_ease]',
].join(' ');

const FAILED_IN = [
  'group-data-[status=failed]:[stroke-dashoffset:0] group-data-[status=failed]:opacity-100',
  'group-data-[status=failed]:[transition:stroke-dashoffset_240ms_cubic-bezier(0.23,1,0.32,1)_120ms,opacity_0ms_linear_120ms]',
  'still:group-data-[status=failed]:[transition:opacity_200ms_ease]',
].join(' ');

const CANCELLED_IN = [
  'group-data-[status=cancelled]:[stroke-dashoffset:0] group-data-[status=cancelled]:opacity-100',
  'group-data-[status=cancelled]:[transition:stroke-dashoffset_240ms_cubic-bezier(0.23,1,0.32,1)_120ms,opacity_0ms_linear_120ms]',
  'still:group-data-[status=cancelled]:[transition:opacity_200ms_ease]',
].join(' ');

const clampToOne = (value: number): number => Math.min(1, Math.max(0, value));

/**
 * A small round mark for where something stands, after React Bits' Status Mark: a ring of dashes
 * while it waits, an arc running round while it works or filling as it goes where how far is
 * known, then a tick drawn in green when it is done, or a cross in red when it failed or was
 * called off. It moves from one to the next rather than swapping, and holds still for whoever
 * asked for stillness. It says nothing itself; whatever holds it says what it is for.
 *
 * @param status - Where the thing stands.
 * @param progress - How far along it is, from nothing to done, where that is known while running.
 * @param size - How large to draw it, in pixels.
 * @param strokeWidth - How thick its lines are, in a 24-unit box.
 * @param dashes - How many dashes make the ring while it waits.
 * @param spinMilliseconds - How long the arc takes to run once round.
 * @param arcLength - How much of the ring the arc covers while it runs, from none to all.
 * @param className - Extra classes for the caller's own layout.
 */
const StatusRing = ({
  status = 'pending',
  progress,
  size = 20,
  strokeWidth = 2,
  dashes = 8,
  spinMilliseconds = 1100,
  arcLength = 0.68,
  className,
}: StatusRingProps) => {
  const isStill = useReducedMotionConfig() === true;
  const radius = 10 - strokeWidth / 2;
  const around = 2 * Math.PI * radius;
  const dash = around / Math.max(1, dashes);
  const isKnown = status === 'running' && progress !== undefined && Number.isFinite(progress);
  const isUnknown = status === 'running' && !isKnown;
  const isSolid = status === 'running' || status === 'done' || status === 'failed';
  const arcTo = isUnknown ? arcLength : isKnown ? clampToOne(progress) : 1;
  const mode = useMotionValue(isSolid ? 1 : 0);
  const arc = useMotionValue(arcTo);
  const travel = useMotionValue(0);
  const ring = useRef<SVGCircleElement>(null);
  const shape = useRef({ around, dash });
  const turn = useRef(0);

  useLayoutEffect(() => {
    shape.current = { around, dash };
  });

  useEffect(() => {
    const writeDash = () => {
      const { around: length, dash: step } = shape.current;
      const blend = mode.get();
      const covered = arc.get();
      const on = IDLE_DASH * step + (covered * length - IDLE_DASH * step) * blend;
      const off =
        (1 - IDLE_DASH) * step + ((1 - covered) * length - (1 - IDLE_DASH) * step) * blend;

      ring.current?.setAttribute(
        'stroke-dasharray',
        `${Math.max(0, on).toString()} ${Math.max(0, off).toString()}`,
      );
    };
    const writeOffset = (value: number) => {
      ring.current?.setAttribute('stroke-dashoffset', value.toString());
    };

    writeDash();
    writeOffset(travel.get());

    const stops = [
      mode.on('change', writeDash),
      arc.on('change', writeDash),
      travel.on('change', writeOffset),
    ];

    return () => {
      stops.forEach((stop) => {
        stop();
      });
      mode.stop();
      arc.stop();
      travel.stop();
    };
  }, [mode, arc, travel, around, dash]);

  useEffect(() => {
    turn.current += 1;

    const thisTurn = turn.current;

    if (isStill) {
      mode.jump(isSolid ? 1 : 0);
      arc.jump(arcTo);
      travel.jump(0);

      return;
    }

    if (mode.get() === 0) {
      arc.jump(arcTo);
    }

    void animate(mode, isSolid ? 1 : 0, MORPH);
    void animate(arc, arcTo, SETTLE);

    if (isUnknown) {
      travel.jump(0);

      return;
    }

    const unit = isKnown ? around : dash;

    void animate(travel, Math.floor(travel.get() / unit) * unit, SETTLE).then(() => {
      if (turn.current === thisTurn) {
        travel.jump(0);
      }
    });
  }, [
    status,
    isKnown,
    isUnknown,
    isSolid,
    arcTo,
    isStill,
    around,
    dash,
    spinMilliseconds,
    mode,
    arc,
    travel,
  ]);

  return (
    <span
      aria-hidden
      data-status={status}
      {...(isUnknown ? { 'data-unknown': '' } : {})}
      className={cn('group inline-flex shrink-0 items-center leading-none', className)}
    >
      <svg
        viewBox="0 0 24 24"
        width={size}
        height={size}
        strokeWidth={strokeWidth}
        style={
          isUnknown && !isStill
            ? { animation: `valence-spin ${spinMilliseconds.toString()}ms linear infinite` }
            : undefined
        }
        className="shrink-0 overflow-visible text-current transition-colors duration-200 group-data-[status=done]:text-success group-data-[status=failed]:text-danger"
      >
        <circle
          cx="12"
          cy="12"
          r={radius}
          transform="rotate(-90 12 12)"
          className="fill-current stroke-current [fill-opacity:0] [stroke-opacity:0] [transition:fill-opacity_180ms_ease,stroke-opacity_200ms_ease] group-data-[status=done]:[fill-opacity:0.06] group-data-[status=failed]:[fill-opacity:0.06] group-data-[status=running]:[stroke-opacity:0.2]"
        />
        <circle
          ref={ring}
          cx="12"
          cy="12"
          r={radius}
          transform="rotate(-90 12 12)"
          className={cn(
            STROKE,
            'opacity-55 transition-opacity duration-200 group-data-[status=done]:opacity-100 group-data-[status=failed]:opacity-100 group-data-[status=running]:opacity-100 still:group-data-[unknown]:animate-pulse',
          )}
        />
        <path d={CHECK} pathLength="1" className={cn(STROKE, DRAWN, TICK_IN)} />
        <path d={CROSS} pathLength="1" className={cn(STROKE, DRAWN, FAILED_IN, CANCELLED_IN)} />
      </svg>
    </span>
  );
};

StatusRing.displayName = 'StatusRing';

export { StatusRing };
