import { Fragment, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useReducedMotionConfig } from 'motion/react';
import { PageCurl } from '@ValenceUI/PageCurl';
import { useCurlTurn } from '@ValenceUI/useCurlTurn';
import { PAGE_TURN } from '@ValenceCore/tokens/PAGE_TURN';
import { turnOfPageSwipe } from '@ValenceCore/functions/turnOfPageSwipe';
import { isCurlPull } from '@ValenceCore/functions/isCurlPull';
import { usePageDrag } from '@ValenceUI/usePageDrag';
import type { CurlHold, CurlLeaf } from '@ValenceCore/functions/pageCurl.types';
import type { SpreadStageProps } from './SpreadStage.types';

const TURN_SECONDS = PAGE_TURN.curls.ms / 1000;

const QUICKEST_SECONDS = 0.14;

const MOST_STEPS = 6;

type Turning = CurlHold & { base: number };

/**
 * How long one turn should take when others are waiting behind it: the more turns are stacked up,
 * the quicker each goes, down to a flick that is still a page turning rather than a cut.
 *
 * @param waiting - How many more turns are waiting after this one.
 * @returns The seconds this turn should take.
 */
const secondsFor = (waiting: number): number =>
  Math.max(QUICKEST_SECONDS, TURN_SECONDS / (1 + waiting * 1.5));

/**
 * The page or pair of pages a reader is on, drawn, and turned to the next with the phone's page
 * curl: taken hold of anywhere with a finger, the pointer or a two-finger swipe, the corner nearest
 * the hold lifts and follows the hand wherever it goes, folding the page along the crease between
 * where the corner was and where it is now, and let go it goes over or falls back. Whether it goes
 * over is decided as the phone decides a swipe, by `turnOfPageSwipe`, and it gets there with the
 * curl's own ease. The shape of the curl comes from the shared page-curl geometry in core, so it is
 * the same curl on every client that draws one.
 *
 * Going back curls the page before down over this one from where it lies turned, the same curl run
 * the other way. A pair turns its outer page over the spine, its back showing the page that will face
 * it; a single page shows its own reverse through the paper. Where there is nothing further that way,
 * the corner does not lift.
 *
 * Turned by a key or a button, the page curls over by itself from its bottom corner. Asked for a
 * spread several turns away, it curls through every page in between, each quicker for the turns
 * still waiting behind it; asked for one a long way off, it goes most of the way at once and turns
 * the last few. Where turning is not animated, or somebody has asked for less movement, the next page
 * is simply there.
 *
 * @param spreads - Every spread of the chapter, each as its pages in reading order.
 * @param spreadAt - Which spread is asked for.
 * What a page is — a picture of a comic's page, or a page of a book's text — is the reader's to
 * draw; this lays them out, holds them and turns them, and the curl measures whatever the reader
 * marks as a page with `data-reader-page`.
 *
 * @param turnKey - What is being read, such as the chapter, which starts it afresh when it changes.
 * @param gap - The room, in pixels, between the two pages of a pair.
 * @param isRightToLeft - Whether the book is read right to left.
 * @param isAnimated - Whether turning a page is animated.
 * @param isHeld - Whether the page is zoomed in and being moved about, when it cannot be turned by
 *   dragging.
 * @param canGoBack - Whether there is a chapter before this one to turn back into.
 * @param canGoOn - Whether there is a chapter after this one to turn on into.
 * @param onTurn - Told a page was turned by dragging it, one on or one back.
 * @param renderPage - Draws one page, and whether it is to be seen or only hold its place.
 */
const SpreadStage = ({
  spreads,
  spreadAt,
  turnKey,
  gap,
  isRightToLeft,
  isAnimated,
  isHeld = false,
  canGoBack = false,
  canGoOn = false,
  onTurn,
  renderPage,
}: SpreadStageProps) => {
  const prefersReducedMotion = useReducedMotionConfig();
  const isMoving = isAnimated && prefersReducedMotion !== true;
  const [shownAt, setShownAt] = useState(spreadAt);
  const [shownKey, setShownKey] = useState(turnKey);
  const [turning, setTurning] = useState<Turning | null>(null);
  const turningRef = useRef<Turning | null>(null);
  const stage = useRef<HTMLDivElement | null>(null);
  const curl = useCurlTurn();
  const { x: cornerX, y: cornerY } = curl;
  const onward = isRightToLeft ? 1 : -1;

  const settle = (next: Turning | null) => {
    turningRef.current = next;
    setTurning(next);
  };

  if (turnKey !== shownKey) {
    setShownKey(turnKey);
    setShownAt(spreadAt);
    setTurning(null);
  }

  useLayoutEffect(() => {
    turningRef.current = null;
  }, [turnKey]);

  useLayoutEffect(() => {
    curl.stop();
  }, [turnKey, curl]);

  const mayGo = (by: 1 | -1): boolean =>
    by === 1 ? shownAt < spreads.length - 1 || canGoOn : shownAt > 0 || canGoBack;

  const byOf = (towards: -1 | 1): 1 | -1 => (towards === onward ? 1 : -1);

  const leafNow = (): CurlLeaf => {
    const box = stage.current?.getBoundingClientRect();
    const pages = [...(stage.current?.querySelectorAll('[data-reader-page]') ?? [])]
      .map((page) => page.getBoundingClientRect())
      .filter((rect) => rect.width > 0 && rect.height > 0);
    const outer = pages.reduce<DOMRect | null>(
      (best, rect) =>
        best === null || (isRightToLeft ? rect.left < best.left : rect.right > best.right)
          ? rect
          : best,
      null,
    );
    const spine = isRightToLeft ? 'right' : 'left';

    if (box === undefined || outer === null) {
      return {
        x: 0,
        y: 0,
        width: Math.max(stage.current?.clientWidth ?? 1, 1),
        height: Math.max(stage.current?.clientHeight ?? 1, 1),
        spine,
      };
    }

    return {
      x: outer.left - box.left,
      y: outer.top - box.top,
      width: outer.width,
      height: outer.height,
      spine,
    };
  };

  const begin = (by: 1 | -1, heldAt: number): Turning | null => {
    const base = by === 1 ? shownAt : shownAt - 1;

    if (base < 0 || base + 1 >= spreads.length) {
      return null;
    }

    return { ...curl.lift(leafNow(), heldAt, by), base };
  };

  const land = (by: 1 | -1) => {
    const toAt = shownAt + by;

    if (toAt >= 0 && toAt < spreads.length) {
      setShownAt(toAt);
    }

    settle(null);
    onTurn?.(by);
  };

  const surface = useCallback(
    () => stage.current?.closest<HTMLElement>('[data-reader-surface]') ?? stage.current,
    [],
  );

  const drag = usePageDrag({
    surface,
    isPull: isCurlPull,
    isOn: !isHeld && onTurn !== undefined,
    isMouseAllowed: true,
    reach: () => Math.max(stage.current?.clientWidth ?? 1, 1),
    mayMove: (towards) => mayGo(byOf(towards)),
    onMove: (moved, down, heldAt) => {
      if (!isMoving) {
        return;
      }

      let held = turningRef.current;

      if (held === null) {
        if (moved === 0) {
          return;
        }

        held = begin(
          byOf(moved < 0 ? -1 : 1),
          heldAt.y - (stage.current?.getBoundingClientRect().top ?? 0),
        );

        if (held === null) {
          return;
        }

        settle(held);
      }

      curl.pull(held, moved, down);
    },
    onRelease: (offset, velocity) => {
      const towards = turnOfPageSwipe(offset, velocity);
      const by = towards === 0 ? null : byOf(towards);
      const held = turningRef.current;

      if (held === null) {
        if (by !== null && mayGo(by)) {
          land(by);
        }

        return;
      }

      const turns = by === held.heading;

      curl.carry(held, turns, () => {
        if (turns) {
          land(held.heading);
        } else {
          settle(null);
        }
      });
    },
  });

  const turnsBy = useRef({ begin, settle });

  useLayoutEffect(() => {
    turnsBy.current = { begin, settle };
  });

  useEffect(() => {
    if (turning !== null) {
      return;
    }

    const { begin: beginTurn, settle: settleTurn } = turnsBy.current;
    const away = spreadAt - shownAt;

    if (away === 0) {
      return;
    }

    if (!isMoving) {
      setShownAt(spreadAt);

      return;
    }

    const step = away < 0 ? -1 : 1;

    if (Math.abs(away) > MOST_STEPS) {
      setShownAt(spreadAt - step);

      return;
    }

    const held = beginTurn(step, Number.POSITIVE_INFINITY);

    if (held === null) {
      setShownAt(shownAt + step);

      return;
    }

    settleTurn(held);
    curl.sweep(held, secondsFor(Math.abs(away) - 1), () => {
      setShownAt(shownAt + step);
      settleTurn(null);
    });
  }, [turning, spreadAt, shownAt, isMoving, curl]);

  const page = (number: number, isShown: boolean) => (
    <Fragment key={number}>{renderPage(number, isShown)}</Fragment>
  );

  const spreadOf = (pages: readonly number[], showing: 'all' | 'outer' | 'inner' = 'all') => {
    const laid = isRightToLeft ? [...pages].reverse() : pages;
    const outer = isRightToLeft ? 0 : laid.length - 1;

    return (
      <div
        className="flex h-full w-full items-center justify-center"
        style={{ gap: `${gap.toString()}px` }}
      >
        {laid.map((number, at) =>
          page(
            number,
            showing === 'all' ||
              (showing === 'outer' ? at === outer : at !== outer || laid.length === 1),
          ),
        )}
      </div>
    );
  };

  const flat = spreads[isMoving ? shownAt : spreadAt] ?? spreads[spreadAt] ?? [];

  const stageOf = () => {
    if (!isMoving || turning === null) {
      return spreadOf(flat);
    }

    const upper = spreads[turning.base] ?? [];
    const lower = spreads[turning.base + 1] ?? [];
    const isPaired = upper.length === 2 && lower.length === 2;

    return (
      <PageCurl
        key={`${turning.base.toString()}-${turning.heading.toString()}`}
        leaf={turning.leaf}
        corner={turning.corner}
        x={cornerX}
        y={cornerY}
        under={spreadOf(lower)}
        {...(upper.length === 2 ? { rest: spreadOf(upper, 'inner') } : {})}
        front={spreadOf(upper, 'outer')}
        back={isPaired ? spreadOf(lower, 'inner') : spreadOf(upper, 'outer')}
        isBackFacing={isPaired}
      />
    );
  };

  return (
    <div
      ref={stage}
      className="relative h-full w-full touch-pan-y overflow-hidden select-none"
      {...drag}
    >
      {stageOf()}
    </div>
  );
};

SpreadStage.displayName = 'SpreadStage';

export { SpreadStage };
