import { useEffect, useLayoutEffect, useRef } from 'react';
import { PAGE_TURN } from '@ValenceCore/tokens/PAGE_TURN';
import { isPageSwipe } from '@ValenceCore/functions/isPageSwipe';
import type { MotionValue } from 'motion/react';
import type { MouseEvent, PointerEvent, WheelEvent } from 'react';

const SAMPLED_FOR_MS = 100;

const WHEEL_SETTLES_MS = 140;

const WHEEL_QUIET_MS = 220;

const LINE_PIXELS = 16;

type Sample = { at: number; x: number };

type Press = {
  id: number;
  isPrimary: boolean;
  pointerType: string;
  button: number;
  x: number;
  y: number;
  at: number;
  element: HTMLElement;
};

type Spin = { deltaX: number; deltaY: number; deltaMode: number; at: number; box: DOMRect };

type Stoppable = { stopPropagation: () => void; preventDefault: () => void };

type PageDragOptions = {
  travel?: MotionValue<number>;
  isOn: boolean;
  isMouseAllowed: boolean;
  reach: () => number;
  mayMove: (towards: -1 | 1) => boolean;
  surface?: () => HTMLElement | null;
  isPull?: (across: number, down: number) => boolean;
  onMove?: (across: number, down: number, heldAt: { x: number; y: number }) => void;
  onRelease: (offset: number, velocity: number) => void;
};

/**
 * Works out how fast something was moving from where it has been lately.
 *
 * @param samples - Where it was, and when, oldest first.
 * @returns Pixels a millisecond, rightwards positive.
 */
const velocityOf = (samples: readonly Sample[]): number => {
  const first = samples[0];
  const last = samples.at(-1);

  if (first === undefined || last === undefined || last.at - first.at < 1) {
    return 0;
  }

  return (last.x - first.x) / (last.at - first.at);
};

/**
 * Keeps only the samples recent enough to say how fast something is moving now.
 *
 * @param samples - Where it has been, oldest first.
 * @param at - Now.
 * @returns The recent ones.
 */
const recent = (samples: readonly Sample[], at: number): Sample[] =>
  samples.filter((one) => at - one.at <= SAMPLED_FOR_MS);

/**
 * Reads what a drag needs to know from a pointer event, whichever kind it is.
 *
 * @param event - The event.
 * @param element - The element being dragged on.
 * @returns The press.
 */
const pressOf = (
  event: Pick<
    globalThis.PointerEvent,
    'pointerId' | 'isPrimary' | 'pointerType' | 'button' | 'clientX' | 'clientY' | 'timeStamp'
  >,
  element: HTMLElement,
): Press => ({
  id: event.pointerId,
  isPrimary: event.isPrimary,
  pointerType: event.pointerType,
  button: event.button,
  x: event.clientX,
  y: event.clientY,
  at: event.timeStamp,
  element,
});

/**
 * Lets a page be swiped sideways with a finger, the pointer, or two fingers on a trackpad, and says
 * how far and how fast it was going when it was let go, so the reader can turn it or let it stay.
 * Given somewhere to put it, the page follows along as it goes, and holds still where there is
 * nothing further that way.
 *
 * A swipe begins by the phone's own measure, `isPageSwipe`, so a tap stays a tap and a scroll stays a
 * scroll; the click a swipe ends with is swallowed. A second finger coming down lets go, leaving
 * pinching to the reader.
 *
 * @param travel - Where the page is, in pixels, rightwards positive; set while it is held, where the
 *   page follows the swipe at all.
 * @param isOn - Whether the page can be taken hold of at all.
 * @param isMouseAllowed - Whether a mouse can drag it too, rather than only fingers and pens, which
 *   is not wanted over text somebody may want to select.
 * @param reach - How far the page can go, which is one page's width.
 * @param mayMove - Whether there is anything further in a direction, left or right.
 * @param surface - An element to listen on instead of the one the returned handlers are spread onto,
 *   for a page with controls laid over it — the swipe is caught wherever it starts over that element,
 *   and the click of a tap that was not a swipe still reaches the control.
 * @param isPull - What counts as taking hold, where it is not the phone's swipe — a curl's corner can
 *   be pulled off at an angle.
 * @param onMove - Told, as it goes, how far the page has been carried from where it was taken hold
 *   of, across and down, and where on the screen that was — for a page that curls from the point
 *   held rather than only sliding.
 * @param onRelease - Told how far the page was swiped, and how fast, in pixels a millisecond, it was
 *   going when let go.
 * @returns What to spread onto the element the page is dragged on, which is nothing where a surface
 *   is given.
 */
const usePageDrag = ({
  travel,
  isOn,
  isMouseAllowed,
  reach,
  mayMove,
  surface,
  isPull = isPageSwipe,
  onMove,
  onRelease,
}: PageDragOptions) => {
  const held = useRef<{
    id: number;
    x: number;
    y: number;
    from: number;
    base: number;
    isDragging: boolean;
    samples: Sample[];
  } | null>(null);
  const wheel = useRef<{
    base: number;
    offset: number;
    heldAt: { x: number; y: number };
    samples: Sample[];
  } | null>(null);
  const wheelTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const quietUntil = useRef(0);
  const swallowClick = useRef(false);

  useEffect(
    () => () => {
      clearTimeout(wheelTimer.current);
    },
    [],
  );

  const resisted = (offset: number): number => {
    const most = Math.max(reach(), 1);

    if (offset !== 0 && !mayMove(offset < 0 ? -1 : 1)) {
      return 0;
    }

    return Math.max(-most, Math.min(most, offset));
  };

  const down = (press: Press) => {
    if (held.current !== null && !press.isPrimary) {
      const was = held.current;

      held.current = null;

      if (was.isDragging) {
        onRelease(0, 0);
      }

      return;
    }

    if (
      !isOn ||
      !press.isPrimary ||
      (press.pointerType === 'mouse' && (!isMouseAllowed || press.button !== 0))
    ) {
      return;
    }

    held.current = {
      id: press.id,
      x: press.x,
      y: press.y,
      from: press.x,
      base: 0,
      isDragging: false,
      samples: [],
    };
  };

  const move = (press: Press) => {
    const holding = held.current;

    if (holding === null || holding.id !== press.id) {
      return;
    }

    const across = press.x - holding.x;
    const downwards = press.y - holding.y;

    if (!holding.isDragging) {
      if (isPull(across, downwards)) {
        travel?.stop();
        holding.isDragging = true;
        holding.base = travel?.get() ?? 0;
        holding.from = press.x;
        press.element.setPointerCapture(press.id);
      } else if (Math.abs(downwards) > PAGE_TURN.startsAfter) {
        held.current = null;
      }

      return;
    }

    holding.samples = recent([...holding.samples, { at: press.at, x: press.x }], press.at);
    travel?.set(holding.base + resisted(press.x - holding.from));
    onMove?.(resisted(across), downwards, { x: holding.x, y: holding.y });
  };

  const up = (press: Press) => {
    const holding = held.current;

    if (holding === null || holding.id !== press.id) {
      return;
    }

    held.current = null;

    if (holding.isDragging) {
      swallowClick.current = true;
      onRelease(press.x - holding.from, velocityOf(holding.samples));
    }
  };

  const cancel = (press: Press) => {
    const holding = held.current;

    if (holding === null || holding.id !== press.id) {
      return;
    }

    held.current = null;

    if (holding.isDragging) {
      onRelease(0, 0);
    }
  };

  const click = (event: Stoppable) => {
    if (swallowClick.current) {
      swallowClick.current = false;
      event.stopPropagation();
      event.preventDefault();
    }
  };

  const spin = (turned: Spin) => {
    if (!isOn || Math.abs(turned.deltaX) <= Math.abs(turned.deltaY)) {
      return;
    }

    if (wheel.current === null && turned.at < quietUntil.current) {
      quietUntil.current = turned.at + WHEEL_QUIET_MS;

      return;
    }

    if (wheel.current === null) {
      travel?.stop();
      wheel.current = {
        base: travel?.get() ?? 0,
        offset: 0,
        heldAt: { x: turned.box.left + turned.box.width / 2, y: turned.box.bottom },
        samples: [],
      };
    }

    const swiping = wheel.current;
    const delta = turned.deltaMode === 1 ? turned.deltaX * LINE_PIXELS : turned.deltaX;

    swiping.offset -= delta;
    swiping.samples = recent([...swiping.samples, { at: turned.at, x: swiping.offset }], turned.at);
    travel?.set(swiping.base + resisted(swiping.offset));
    onMove?.(resisted(swiping.offset), 0, swiping.heldAt);

    clearTimeout(wheelTimer.current);
    wheelTimer.current = setTimeout(() => {
      const ended = wheel.current;

      wheel.current = null;
      quietUntil.current = performance.now() + WHEEL_QUIET_MS;

      if (ended !== null) {
        onRelease(ended.offset, velocityOf(ended.samples));
      }
    }, WHEEL_SETTLES_MS);
  };

  const latest = useRef({ down, move, up, cancel, click, spin });

  useLayoutEffect(() => {
    latest.current = { down, move, up, cancel, click, spin };
  });

  const isOnSurface = surface !== undefined;

  useEffect(() => {
    const element = surface?.() ?? null;

    if (element === null) {
      return;
    }

    const pressed = (event: globalThis.PointerEvent) => {
      latest.current.down(pressOf(event, element));
    };
    const moved = (event: globalThis.PointerEvent) => {
      latest.current.move(pressOf(event, element));
    };
    const lifted = (event: globalThis.PointerEvent) => {
      latest.current.up(pressOf(event, element));
    };
    const cancelled = (event: globalThis.PointerEvent) => {
      latest.current.cancel(pressOf(event, element));
    };
    const clicked = (event: globalThis.MouseEvent) => {
      latest.current.click(event);
    };
    const wheeled = (event: globalThis.WheelEvent) => {
      latest.current.spin({
        deltaX: event.deltaX,
        deltaY: event.deltaY,
        deltaMode: event.deltaMode,
        at: event.timeStamp,
        box: element.getBoundingClientRect(),
      });
    };

    element.addEventListener('pointerdown', pressed);
    element.addEventListener('pointermove', moved);
    element.addEventListener('pointerup', lifted);
    element.addEventListener('pointercancel', cancelled);
    element.addEventListener('click', clicked, { capture: true });
    element.addEventListener('wheel', wheeled, { passive: true });

    return () => {
      element.removeEventListener('pointerdown', pressed);
      element.removeEventListener('pointermove', moved);
      element.removeEventListener('pointerup', lifted);
      element.removeEventListener('pointercancel', cancelled);
      element.removeEventListener('click', clicked, { capture: true });
      element.removeEventListener('wheel', wheeled);
    };
  }, [isOnSurface, surface]);

  if (isOnSurface) {
    return {};
  }

  return {
    onPointerDown: (event: PointerEvent<HTMLElement>) => {
      down(pressOf(event, event.currentTarget));
    },
    onPointerMove: (event: PointerEvent<HTMLElement>) => {
      move(pressOf(event, event.currentTarget));
    },
    onPointerUp: (event: PointerEvent<HTMLElement>) => {
      up(pressOf(event, event.currentTarget));
    },
    onPointerCancel: (event: PointerEvent<HTMLElement>) => {
      cancel(pressOf(event, event.currentTarget));
    },
    onClickCapture: (event: MouseEvent<HTMLElement>) => {
      click(event);
    },
    onWheel: (event: WheelEvent<HTMLElement>) => {
      spin({
        deltaX: event.deltaX,
        deltaY: event.deltaY,
        deltaMode: event.deltaMode,
        at: event.timeStamp,
        box: event.currentTarget.getBoundingClientRect(),
      });
    },
  };
};

export { usePageDrag };
