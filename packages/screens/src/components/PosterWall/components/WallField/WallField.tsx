import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent, PointerEvent } from 'react';
import { animate, useMotionValue, useMotionValueEvent, useReducedMotionConfig } from 'motion/react';
import { Button } from '@ValenceUI/Button';
import { Spinner } from '@ValenceUI/Spinner';
import { cn } from '@ValenceUI/cn';
import { fisheyeAt } from '@ValenceScreens/components/PosterWall/fisheyeAt';
import { nearestOnWall } from '@ValenceScreens/components/PosterWall/nearestOnWall';
import { placeOnWall } from '@ValenceScreens/components/PosterWall/placeOnWall';
import { useWallTitles } from '@ValenceScreens/components/PosterWall/useWallTitles';
import { wallGrid } from '@ValenceScreens/components/PosterWall/wallGrid';
import { wallLens } from '@ValenceScreens/components/PosterWall/wallLens';
import { titleAtCell } from '@ValenceScreens/components/PosterWall/titleAtCell';
import { useWallAxis } from '@ValenceScreens/components/PosterWall/useWallAxis';
import { isOnScreen } from '@ValenceScreens/components/PosterWall/isOnScreen';
import type {
  WallCell,
  WallLens,
  WallPoint,
  WallTitle,
} from '@ValenceScreens/components/PosterWall/PosterWall.types';
import type { WallFieldProps } from './WallField.types';
import { say } from '@ValenceI18n/say';

const SETTLE = { type: 'spring', bounce: 0, duration: 0.5 } as const;

const DRAG_BEGINS_AT = 6;

const DECELERATION = 0.998;

const WHEEL_SETTLES_AFTER_MS = 140;

const VELOCITY_WINDOW_MS = 100;

/**
 * How far a throw carries before it comes to rest, as a scroll view decelerates.
 *
 * @param velocity - How fast it was thrown, in pixels a second.
 * @returns How far it goes.
 */
const carriedBy = (velocity: number): number =>
  ((velocity / 1000) * DECELERATION) / (1 - DECELERATION);

/**
 * How far out on the wall a poster can be and still be drawn on the screen, found by halving the
 * distance until it lands on the screen's corner.
 *
 * @param lens - How strongly the wall falls away.
 * @param corner - How far the screen's corner is from its middle.
 * @returns The distance on the wall.
 */
const reachOf = (lens: WallLens, corner: number): number => {
  let near = 0;
  let far = corner / lens.least;

  for (let step = 0; step < 24; step += 1) {
    const middle = (near + far) / 2;

    if (fisheyeAt(middle, 0, lens).x < corner) {
      near = middle;
    } else {
      far = middle;
    }
  }

  return far;
};

/**
 * What a place on the wall is known by while it is on screen.
 *
 * @param cell - The place.
 * @returns Its key.
 */
const keyOfCell = (cell: WallCell): string => `${cell.row.toString()}:${cell.column.toString()}`;

/**
 * The wall itself: every poster laid out in a honeycomb that runs on for ever in every direction,
 * drawn largest in the middle and smaller and dimmer towards the edges, the way a watch lays out its
 * apps. It is dragged or scrolled about, thrown with a flick, and always comes to rest with one
 * poster in the middle, which is the one a second press or Enter opens, and Escape closes it.
 *
 * Only the posters near the screen are drawn, and they are moved by writing their transforms
 * straight onto them each frame rather than through React, since a wall can hold thousands.
 *
 * @param onClose - Closes the wall.
 * @param onOpenFilm - Opens a film.
 * @param onOpenShow - Opens a programme.
 */
const WallField = ({ onClose, onOpenFilm, onOpenShow }: WallFieldProps) => {
  const [seed] = useState(() => Math.floor(Math.random() * 1_000_000_007));
  const { titles, isReading } = useWallTitles(seed);
  const isStill = useReducedMotionConfig() === true;

  const fieldRef = useRef<HTMLDivElement>(null);
  const tiles = useRef(new Map<string, { cell: WallCell; tile: HTMLElement }>());
  const press = useRef<{
    x: number;
    y: number;
    fromX: number;
    fromY: number;
    isDragging: boolean;
    heard: { at: number; x: number; y: number }[];
  } | null>(null);
  const wasDragged = useRef(false);
  const settling = useRef<ReturnType<typeof setTimeout> | null>(null);
  const drawing = useRef(0);

  const [size, setSize] = useState({ width: 0, height: 0 });
  const [focus, setFocus] = useState<WallCell>({ row: 0, column: 0 });
  const [, setOnScreen] = useState('');
  const box = useRef<WallCell[]>([]);

  const panX = useMotionValue(0);
  const panY = useMotionValue(0);

  const grid = useMemo(
    () => wallGrid(titles.length, size.width, size.height),
    [titles.length, size.width, size.height],
  );
  const lens = useMemo(() => wallLens(size.width, size.height), [size.width, size.height]);
  const outermost = useMemo(
    () => reachOf(lens, Math.hypot(size.width, size.height) / 2 + grid.tileHeight),
    [grid.tileHeight, lens, size.height, size.width],
  );

  useEffect(() => {
    const field = fieldRef.current;

    if (field === null) {
      return;
    }

    const observer = new ResizeObserver(([entry]) => {
      if (entry !== undefined) {
        setSize({ width: entry.contentRect.width, height: entry.contentRect.height });
      }
    });

    observer.observe(field);
    field.focus();

    return () => {
      observer.disconnect();
    };
  }, []);

  const draw = useCallback(() => {
    drawing.current = 0;

    const halfWidth = size.width / 2;
    const halfHeight = size.height / 2;
    const fadesFrom = Math.min(halfWidth, halfHeight) * 0.85;
    const fadesBy = Math.hypot(halfWidth, halfHeight);
    const atX = panX.get();
    const atY = panY.get();

    for (const { cell, tile } of tiles.current.values()) {
      const place = placeOnWall(cell, grid);
      const seen = fisheyeAt(place.x - atX, place.y - atY, lens);
      const fade = Math.min(1, Math.max(0, (seen.away - fadesFrom) / (fadesBy - fadesFrom)));

      tile.style.transform = `translate3d(${(halfWidth + seen.x - grid.tileWidth / 2).toFixed(2)}px, ${(halfHeight + seen.y - grid.tileHeight / 2).toFixed(2)}px, 0) scale(${seen.scale.toFixed(4)})`;
      tile.style.opacity = (1 - 0.75 * fade * fade).toFixed(3);
      tile.style.zIndex = Math.round(seen.scale * 100).toString();
    }

    const nearest = nearestOnWall({ x: atX, y: atY }, grid);
    const onScreen = box.current
      .filter((cell) => isOnScreen(cell, { x: atX, y: atY }, grid, lens, size))
      .map(keyOfCell)
      .join(',');

    setOnScreen(onScreen);

    setFocus((standing) =>
      standing.row === nearest.row && standing.column === nearest.column ? standing : nearest,
    );
  }, [grid, lens, panX, panY, size]);

  const schedule = useCallback(() => {
    if (drawing.current === 0) {
      drawing.current = requestAnimationFrame(draw);
    }
  }, [draw]);

  useMotionValueEvent(panX, 'change', schedule);
  useMotionValueEvent(panY, 'change', schedule);

  useLayoutEffect(() => {
    draw();
  });

  useEffect(
    () => () => {
      cancelAnimationFrame(drawing.current);

      if (settling.current !== null) {
        clearTimeout(settling.current);
      }
    },
    [],
  );

  const goTo = useCallback(
    (point: WallPoint, velocity: WallPoint = { x: 0, y: 0 }) => {
      if (isStill) {
        panX.jump(point.x);
        panY.jump(point.y);

        return;
      }

      void animate(panX, point.x, { ...SETTLE, velocity: velocity.x });
      void animate(panY, point.y, { ...SETTLE, velocity: velocity.y });
    },
    [isStill, panX, panY],
  );

  const settleNear = useCallback(
    (point: WallPoint, velocity?: WallPoint) => {
      goTo(placeOnWall(nearestOnWall(point, grid), grid), velocity);
    },
    [goTo, grid],
  );

  useEffect(() => {
    const field = fieldRef.current;

    if (field === null) {
      return;
    }

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();

      if (event.ctrlKey) {
        return;
      }

      panX.stop();
      panY.stop();

      const isSideways = event.shiftKey && event.deltaX === 0;

      panX.set(panX.get() + (isSideways ? event.deltaY : event.deltaX));
      panY.set(panY.get() + (isSideways ? 0 : event.deltaY));

      if (settling.current !== null) {
        clearTimeout(settling.current);
      }

      settling.current = setTimeout(() => {
        settleNear({ x: panX.get(), y: panY.get() });
      }, WHEEL_SETTLES_AFTER_MS);
    };

    field.addEventListener('wheel', onWheel, { passive: false });

    return () => {
      field.removeEventListener('wheel', onWheel);
    };
  }, [panX, panY, settleNear]);

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) {
      return;
    }

    panX.stop();
    panY.stop();
    wasDragged.current = false;
    press.current = {
      x: event.clientX,
      y: event.clientY,
      fromX: panX.get(),
      fromY: panY.get(),
      isDragging: false,
      heard: [{ at: event.timeStamp, x: event.clientX, y: event.clientY }],
    };
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const held = press.current;

    if (held === null) {
      return;
    }

    const movedX = event.clientX - held.x;
    const movedY = event.clientY - held.y;

    if (!held.isDragging) {
      if (Math.hypot(movedX, movedY) < DRAG_BEGINS_AT) {
        return;
      }

      held.isDragging = true;
      wasDragged.current = true;
      event.currentTarget.setPointerCapture(event.pointerId);
    }

    held.heard = [
      ...held.heard.filter((one) => one.at > event.timeStamp - VELOCITY_WINDOW_MS),
      { at: event.timeStamp, x: event.clientX, y: event.clientY },
    ];

    panX.set(held.fromX - movedX);
    panY.set(held.fromY - movedY);
  };

  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const held = press.current;

    press.current = null;

    if (held === null || !held.isDragging) {
      return;
    }

    const first = held.heard[0];
    const seconds = first === undefined ? 0 : (event.timeStamp - first.at) / 1000;
    const velocity =
      first === undefined || seconds <= 0
        ? { x: 0, y: 0 }
        : { x: -(event.clientX - first.x) / seconds, y: -(event.clientY - first.y) / seconds };

    settleNear(
      { x: panX.get() + carriedBy(velocity.x), y: panY.get() + carriedBy(velocity.y) },
      velocity,
    );
  };

  const open = (title: WallTitle) => {
    if (title.kind === 'film') {
      onOpenFilm(title.id);
    } else {
      onOpenShow(title.id);
    }
  };

  const focused = titles[titleAtCell(focus, grid)];

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const place = placeOnWall(focus, grid);
    const steps: Partial<Record<string, WallPoint>> = {
      ArrowLeft: { x: place.x - grid.stepX, y: place.y },
      ArrowRight: { x: place.x + grid.stepX, y: place.y },
      ArrowUp: { x: place.x - grid.stepX / 2, y: place.y - grid.stepY },
      ArrowDown: { x: place.x + grid.stepX / 2, y: place.y + grid.stepY },
    };
    const step = steps[event.key];

    if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
    } else if (event.key === 'Enter' && event.target === event.currentTarget) {
      if (focused !== undefined) {
        event.preventDefault();
        open(focused);
      }
    } else if (step !== undefined) {
      event.preventDefault();
      settleNear(step);
    }
  };

  const rows = useWallAxis(fieldRef, panY, grid.stepY, outermost, false);
  const columns = useWallAxis(fieldRef, panX, grid.stepX, outermost + grid.stepX / 2, true);
  const inBox: WallCell[] =
    titles.length === 0 ? [] : rows.flatMap((row) => columns.map((column) => ({ row, column })));

  useLayoutEffect(() => {
    box.current = inBox;
    schedule();
  });

  const shown =
    size.width === 0
      ? inBox
      : inBox.filter((cell) =>
          isOnScreen(cell, { x: panX.get(), y: panY.get() }, grid, lens, size),
        );

  return (
    <div className="relative size-full overflow-hidden">
      <div
        ref={fieldRef}
        tabIndex={-1}
        aria-label={say('screens.posterWall.label')}
        className="absolute inset-0 touch-none outline-none select-none"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onKeyDown={onKeyDown}
      >
        {shown.map((cell) => {
          const title = titles[titleAtCell(cell, grid)];
          const key = keyOfCell(cell);
          const isFocused = cell.row === focus.row && cell.column === focus.column;

          if (title === undefined) {
            return null;
          }

          return (
            <div
              key={key}
              ref={(tile) => {
                if (tile === null) {
                  return;
                }

                tiles.current.set(key, { cell, tile });

                return () => {
                  tiles.current.delete(key);
                };
              }}
              className="absolute top-0 start-0 will-change-transform"
              style={{ width: grid.tileWidth, height: grid.tileHeight }}
            >
              <Button
                variant="bare"
                size="none"
                hasTooltip={false}
                label={say('common.openTitle', { title: title.title })}
                tabIndex={isFocused ? 0 : -1}
                className={cn(
                  'size-full overflow-hidden rounded-xl bg-surface shadow-[var(--shadow-lifted)]',
                  'transition-[box-shadow] duration-[var(--duration-fast)] ease-[var(--ease-out)]',
                  isFocused ? 'shadow-[0_0_0_3px_var(--color-text),var(--shadow-overlay)]' : '',
                )}
                onClick={() => {
                  if (wasDragged.current) {
                    return;
                  }

                  if (isFocused) {
                    open(title);
                  } else {
                    goTo(placeOnWall(cell, grid));
                  }
                }}
              >
                {title.poster === null ? (
                  <span className="flex size-full items-center justify-center p-3 text-center text-sm font-semibold text-text-muted">
                    {title.title}
                  </span>
                ) : (
                  <img
                    src={title.poster}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    draggable={false}
                    className="size-full object-cover"
                  />
                )}
              </Button>
            </div>
          );
        })}
      </div>

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,var(--color-shade)_100%)]" />

      {titles.length === 0 ? (
        <div className="absolute inset-0 flex items-center justify-center text-text-muted">
          {isReading ? <Spinner label={say('common.loading')} /> : say('screens.posterWall.empty')}
        </div>
      ) : null}
    </div>
  );
};

WallField.displayName = 'WallField';

export { WallField };
