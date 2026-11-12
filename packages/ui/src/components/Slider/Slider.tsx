import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import * as RadixSlider from '@radix-ui/react-slider';
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotionConfig,
  useSpring,
} from 'motion/react';
import { cn } from '@ValenceUI/cn';
import { Tooltip } from '@ValenceUI/Tooltip';
import { liquidOutline } from './liquidOutline';
import type { SliderProps, SliderTone } from './Slider.types';

const TRACK_CLASSES: Record<SliderTone, string> = {
  default: 'bg-surface-raised',
  overlay: 'bg-on-scrim/30',
  glass: 'bg-text/15',
  film: 'bg-on-scrim/25',
};

const SEGMENT_GAP = 2;

const SWELLS_TO = 1.5;

const BULGE_PX = 3;

const LIFT_FADES_PX = 24;

const SWELL_SPRING = { stiffness: 420, damping: 28, mass: 0.6 };

const POINTED_SEGMENT_CLASSES: Record<SliderTone, string> = {
  default: 'bg-text/35',
  overlay: 'bg-on-scrim/55',
  glass: 'bg-text/35',
  film: 'bg-on-scrim/55',
};

const STRETCH_SPRING = { stiffness: 360, damping: 24, mass: 0.6 };

const STRETCH_PER_SPEED = 1.1;

const STRETCH_MOST = 1;

const SETTLES_AFTER_MS = 120;

const KEY_DIRECTIONS: Readonly<Partial<Record<string, 1 | -1>>> = {
  ArrowRight: 1,
  ArrowUp: 1,
  ArrowLeft: -1,
  ArrowDown: -1,
};

const FILL_CLASSES: Record<SliderTone, string> = {
  default: 'bg-text',
  overlay: 'bg-on-scrim',
  glass: 'bg-text',
  film: 'bg-on-scrim',
};

const GROWS_ON_HOVER =
  'origin-center transition-[scale] duration-[var(--duration-fast)] ease-[var(--ease-out)] hover-hover:group-hover/slider:scale-y-[1.6] motion-reduce:transition-none';

/**
 * A track with a handle on it, for choosing one number from a range — a volume, a position in a
 * film, an offset. A caller can draw something above the handle as it moves, which is how scrubbing
 * a film shows the frame being scrubbed to.
 *
 * The pointer is followed on entering as well as on moving. Tracked on movement alone, a pointer
 * already over the track when it appears has entered without moving — which is what happens every
 * time a player's controls fade out and come back under a still hand — so nothing was drawn until
 * the pointer moved again, and the preview read as appearing at random.
 *
 * @param label - What is being chosen, read out to anybody who cannot see the track.
 * @param value - Where the handle sits now.
 * @param min - The smallest value the track reaches, nothing unless said.
 * @param max - The largest value the track reaches.
 * @param step - How far each press of an arrow key moves it, and what a dragged value snaps to.
 * @param onArrowKey - Takes the arrow keys over, told which way each one points, in place of the
 *   handle moving a step — as a seek bar hands them to the player's own skip.
 * @param onValueChange - Told the new value as the handle moves.
 * @param onValueCommit - Told the value somebody settled on, once they let go of the handle or
 *   finish with the keys — for a value that is costly to change, such as where a song is.
 * @param renderPreview - Draws something above the handle for the value being pointed at.
 * @param valueLabel - Names the value the handle is at, shown while the handle is under the pointer
 *   or holding focus. Says where the handle is rather than where the pointer is, which is the
 *   difference between this and a preview: a preview answers "what is there", and this answers
 *   "what have I set". Shown without the pause a tooltip usually takes, since a figure that arrives
 *   half a second after the handle has moved is describing the past.
 * @param tone - Whether it sits on the page, over video, or on a pane of glass whose colour is the
 *   page's own, where the page's raised surface would not show.
 * @param isSlim - Whether to draw a thin line with a small round handle, for a player's own bar.
 * @param isDisabled - Whether it can be moved at all, for a value somebody else is in charge of.
 * @param revealsThumb - Whether the handle stays out of sight until a pointer is over the track, for a
 *   bar that should read as a line of progress until somebody reaches for it. It stays while being
 *   dragged or focused, and is always there on a touch screen, where nothing hovers.
 * @param stretches - Parts of the track to shade, each from and to a fraction of its length — the
 *   intro and the credits of a film.
 * @param notches - Where to break the track, as fractions of its length — where each chapter begins.
 * @param className - Extra classes for the caller's own layout.
 */
const Slider = ({
  label,
  value,
  min = 0,
  max,
  step = 1,
  onArrowKey,
  onValueChange,
  onValueCommit,
  renderPreview,
  valueLabel,
  tone = 'default',
  isSlim = false,
  isDisabled = false,
  revealsThumb = false,
  stretches = [],
  notches = [],
  className,
}: SliderProps) => {
  const prefersReducedMotion = useReducedMotionConfig();
  const trackRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<{ value: number; ratio: number; left: number } | null>(null);
  const [isOnHandle, setIsOnHandle] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const stretch = useSpring(1, STRETCH_SPRING);
  const anchor = useMotionValue(0.5);
  const lastMoveRef = useRef<{ x: number; atMs: number } | null>(null);
  const settleRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const thickness = isSlim ? 3 : 6;
  const liquidX = useMotionValue(0);
  const swell = useSpring(0, SWELL_SPRING);
  const swollen = thickness * SWELLS_TO;
  const boxHeight = swollen + BULGE_PX * 2;
  const trackWidthRef = useRef(0);
  const segmentRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const cuts = [...new Set(notches.filter((notch) => notch > 0 && notch < 1))].sort(
    (left, right) => left - right,
  );
  const isSegmented = cuts.length > 0 || renderPreview !== undefined;
  const segments = [0, ...cuts].map((from, index): [number, number] => [from, cuts[index] ?? 1]);
  const filled = max <= min ? 0 : (value - min) / (max - min);
  const pointedSegment =
    !isSegmented || hover === null
      ? null
      : segments.findIndex(([from, to]) => hover.ratio >= from && hover.ratio < to);
  const restOutline = `inset(${((boxHeight - thickness) / 2).toString()}px 0 round 2px)`;

  const drawLiquid = () => {
    const across = trackWidthRef.current;
    const reach = swell.get();
    const pointer = liquidX.get();

    segments.forEach(([from, to], index) => {
      const element = segmentRefs.current[index];

      if (element === null || element === undefined) {
        return;
      }

      const left = from * across + (index === 0 ? 0 : SEGMENT_GAP / 2);
      const width =
        (to - from) * across -
        (index === 0 ? 0 : SEGMENT_GAP / 2) -
        (index === segments.length - 1 ? 0 : SEGMENT_GAP / 2);
      const away = Math.max(left - pointer, pointer - (left + width), 0);
      const lift = reach * Math.max(1 - away / LIFT_FADES_PX, 0);

      element.style.clipPath =
        across === 0 || reach < 0.01 || away > LIFT_FADES_PX * 2
          ? restOutline
          : liquidOutline(
              width,
              boxHeight,
              thickness + (swollen - thickness) * lift,
              BULGE_PX * reach,
              pointer - left,
            );
    });
  };

  useMotionValueEvent(liquidX, 'change', drawLiquid);
  useMotionValueEvent(swell, 'change', drawLiquid);
  useLayoutEffect(drawLiquid);

  const drag = (clientX: number, atMs: number): void => {
    const last = lastMoveRef.current;

    lastMoveRef.current = { x: clientX, atMs };

    if (last === null || prefersReducedMotion === true) {
      return;
    }

    const moved = clientX - last.x;
    const speed = Math.abs(moved) / Math.max(atMs - last.atMs, 1);

    if (moved !== 0) {
      anchor.set(moved > 0 ? 1 : 0);
      stretch.set(1 + Math.min(speed * STRETCH_PER_SPEED, STRETCH_MOST));
    }

    if (settleRef.current !== null) {
      clearTimeout(settleRef.current);
    }

    settleRef.current = setTimeout(() => {
      stretch.set(1);
    }, SETTLES_AFTER_MS);
  };

  useEffect(() => {
    if (!isDragging) {
      return;
    }

    const letGo = (): void => {
      setIsDragging(false);
      lastMoveRef.current = null;
      stretch.set(1);
    };

    window.addEventListener('pointerup', letGo);
    window.addEventListener('pointercancel', letGo);

    return () => {
      window.removeEventListener('pointerup', letGo);
      window.removeEventListener('pointercancel', letGo);
    };
  }, [isDragging, stretch]);

  const track = useCallback(
    (clientX: number) => {
      const element = trackRef.current;

      if (element === null || max <= min) {
        return;
      }

      const box = element.getBoundingClientRect();

      if (box.width === 0) {
        return;
      }

      const ratio = Math.min(Math.max((clientX - box.left) / box.width, 0), 1);

      const half = (previewRef.current?.offsetWidth ?? 0) / 2;
      const left = Math.min(Math.max(ratio * box.width, half), Math.max(box.width - half, half));

      setHover({ value: min + ratio * (max - min), ratio, left });

      trackWidthRef.current = box.width;

      liquidX.set(ratio * box.width);
      swell.set(prefersReducedMotion === true ? 0 : 1);
    },
    [min, max, swell, liquidX, prefersReducedMotion],
  );

  const handle = (
    <RadixSlider.Thumb
      asChild
      aria-label={label}
      aria-disabled={max <= min}
      onPointerEnter={() => {
        setIsOnHandle(true);
      }}
      onPointerLeave={() => {
        setIsOnHandle(false);
      }}
      className={cn(
        isSlim
          ? 'block size-3 rounded-full shadow outline-none select-none'
          : 'block size-3.5 w-8 rounded-full shadow outline-none select-none',
        'transition-[scale,opacity] duration-[var(--duration-instant)] ease-[var(--ease-out)]',
        'motion-reduce:transition-none hover-hover:hover:scale-110 focus-visible:focus-ring',
        revealsThumb && !isDragging
          ? 'hover-hover:scale-75 hover-hover:opacity-0 hover-hover:group-hover/slider:scale-100 hover-hover:group-hover/slider:opacity-100 focus-visible:scale-100 focus-visible:opacity-100'
          : '',
        FILL_CLASSES[tone],
      )}
    >
      <motion.span style={{ scaleX: stretch, originX: anchor }} />
    </RadixSlider.Thumb>
  );

  return (
    <div data-tone={tone} className={cn('group/slider relative w-full', className)}>
      <AnimatePresence>
        {hover === null || renderPreview === undefined ? null : (
          <motion.div
            ref={previewRef}
            initial={{
              opacity: 0,
              y: prefersReducedMotion === true ? 0 : 6,
              scale: prefersReducedMotion === true ? 1 : 0.96,
            }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{
              opacity: 0,
              y: prefersReducedMotion === true ? 0 : 6,
              scale: prefersReducedMotion === true ? 1 : 0.96,
            }}
            transition={{ duration: prefersReducedMotion === true ? 0 : 0.16, ease: 'easeOut' }}
            className="pointer-events-none absolute bottom-full z-10 mb-2 -translate-x-1/2"
            style={{ left: `${hover.left.toString()}px` }}
          >
            {renderPreview(hover.value)}
          </motion.div>
        )}
      </AnimatePresence>

      <RadixSlider.Root
        value={[value]}
        min={min}
        max={max <= min ? min + 1 : max}
        step={step}
        disabled={isDisabled || max <= min}
        data-slot="slider"
        className="group/slider relative flex w-full cursor-pointer touch-none items-center py-2 select-none data-[disabled]:cursor-default data-[disabled]:opacity-50"
        onValueChange={(next) => {
          onValueChange(next[0] ?? 0);
        }}
        onValueCommit={(next) => {
          queueMicrotask(() => {
            onValueCommit?.(next[0] ?? 0);
          });
        }}
        onKeyDown={(event) => {
          const direction = KEY_DIRECTIONS[event.key];

          if (onArrowKey === undefined || direction === undefined || isDisabled || max <= min) {
            return;
          }

          event.preventDefault();
          onArrowKey(direction);
        }}
        onPointerDown={() => {
          setIsDragging(true);
        }}
        onPointerEnter={(event) => {
          track(event.clientX);
        }}
        onPointerMove={(event) => {
          track(event.clientX);

          if (isDragging) {
            drag(event.clientX, event.timeStamp);
          }
        }}
        onPointerLeave={() => {
          setHover(null);
          swell.set(0);
        }}
      >
        <RadixSlider.Track
          ref={trackRef}
          className={cn(
            isSlim
              ? 'relative h-[3px] w-full grow overflow-hidden rounded-full select-none'
              : 'relative h-1.5 w-full grow overflow-hidden rounded-full select-none',
            isSegmented ? 'overflow-visible rounded-[2px] bg-transparent' : TRACK_CLASSES[tone],
            tone === 'film' && !isSegmented ? GROWS_ON_HOVER : '',
          )}
        >
          <RadixSlider.Range
            className={cn(
              'absolute h-full rounded-full select-none',
              isSegmented ? 'opacity-0' : FILL_CLASSES[tone],
            )}
          />
          {isSegmented ? (
            <>
              {segments.map(([from, to], index) => (
                <span
                  key={`${from.toString()}-${to.toString()}`}
                  data-slot="slider-segment"
                  data-pointed={pointedSegment === index ? '' : undefined}
                  aria-hidden
                  className={cn(
                    'pointer-events-none absolute top-1/2 -translate-y-1/2 overflow-hidden',
                    'transition-[background-color] ease-[var(--ease-out)]',
                    pointedSegment === index
                      ? cn(POINTED_SEGMENT_CLASSES[tone], 'duration-[120ms]')
                      : cn(TRACK_CLASSES[tone], 'duration-[240ms]'),
                  )}
                  style={{
                    left: `calc(${(from * 100).toString()}% + ${(index === 0 ? 0 : SEGMENT_GAP / 2).toString()}px)`,
                    width: `calc(${((to - from) * 100).toString()}% - ${((index === 0 ? 0 : SEGMENT_GAP / 2) + (index === segments.length - 1 ? 0 : SEGMENT_GAP / 2)).toString()}px)`,
                    height: `${boxHeight.toString()}px`,
                  }}
                  ref={(element: HTMLSpanElement | null) => {
                    segmentRefs.current[index] = element;
                  }}
                >
                  {stretches
                    .filter((stretch) => stretch.to > from && stretch.from < to)
                    .map((stretch) => (
                      <span
                        key={`${stretch.from.toString()}-${stretch.to.toString()}`}
                        data-slot="slider-stretch"
                        className="absolute inset-y-0 bg-warning/80"
                        style={{
                          left: `${(((Math.max(stretch.from, from) - from) / (to - from)) * 100).toString()}%`,
                          width: `${(((Math.min(stretch.to, to) - Math.max(stretch.from, from)) / (to - from)) * 100).toString()}%`,
                        }}
                      />
                    ))}
                  <span
                    className={cn('absolute inset-0 origin-left', FILL_CLASSES[tone])}
                    style={{
                      transform: `scaleX(${Math.min(Math.max((filled - from) / (to - from), 0), 1).toString()})`,
                    }}
                  />
                </span>
              ))}
            </>
          ) : (
            stretches.map((stretch) => (
              <span
                key={`${stretch.from.toString()}-${stretch.to.toString()}`}
                data-slot="slider-stretch"
                aria-hidden
                className="pointer-events-none absolute inset-y-0 bg-warning/80"
                style={{
                  left: `${(stretch.from * 100).toString()}%`,
                  width: `${((stretch.to - stretch.from) * 100).toString()}%`,
                }}
              />
            ))
          )}
        </RadixSlider.Track>

        {renderPreview === undefined ? null : (
          <span
            data-slot="slider-pointer-line"
            aria-hidden
            className={cn(
              'pointer-events-none absolute top-1/2 h-3.5 w-0.5 -translate-x-1/2 -translate-y-1/2 rounded-full',
              'transition-[opacity,background-color] duration-[var(--duration-instant)] ease-[var(--ease-out)]',
              hover !== null && hover.ratio <= filled
                ? 'bg-shade/85 shadow-[0_0_0_1px_color-mix(in_oklab,var(--color-on-scrim)_30%,transparent)]'
                : cn(
                    FILL_CLASSES[tone],
                    'shadow-[0_0_0_1px_color-mix(in_oklab,var(--color-shade)_35%,transparent)]',
                  ),
              hover === null || isDragging ? 'opacity-0' : 'opacity-100',
            )}
            style={{ left: `${((hover?.ratio ?? 0) * 100).toString()}%` }}
          />
        )}

        {valueLabel === undefined ? (
          handle
        ) : (
          <Tooltip
            label={valueLabel(value)}
            delayMilliseconds={0}
            isOpen={isOnHandle || isDragging}
          >
            {handle}
          </Tooltip>
        )}
      </RadixSlider.Root>
    </div>
  );
};

Slider.displayName = 'Slider';

export { Slider };
