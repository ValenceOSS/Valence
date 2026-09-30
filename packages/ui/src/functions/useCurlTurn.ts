import { useMemo, useRef } from 'react';
import { animate, useMotionValue } from 'motion/react';
import { PAGE_TURN } from '@ValenceCore/tokens/PAGE_TURN';
import { clampCurl } from '@ValenceCore/functions/clampCurl';
import { curlArcAt } from '@ValenceCore/functions/curlArcAt';
import { curlAwayOf } from '@ValenceCore/functions/curlAwayOf';
import { curlCornerOf } from '@ValenceCore/functions/curlCornerOf';
import type { CurlHold, CurlLeaf } from '@ValenceCore/functions/pageCurl.types';
import type { CurlTurn } from './useCurlTurn.types';

const TURN_SECONDS = PAGE_TURN.curls.ms / 1000;

/**
 * Moves the corner of a page being turned, for anything that draws a `PageCurl`: lifts it from the
 * corner nearest the hold (or, going back, from where it lies turned), follows a hand as it pulls,
 * carries it over or back on the curl's own ease when let go, and sweeps it over by itself along the
 * phone's arc for a turn made by a key, a button or a demonstration. Whatever it is doing is dropped
 * when it is stopped, so a curl started for a page that has since changed never finishes.
 *
 * @returns Where the corner is, and the ways of moving it.
 */
const useCurlTurn = (): CurlTurn => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const generation = useRef(0);

  return useMemo(() => {
    const stop = () => {
      generation.current += 1;
      x.stop();
      y.stop();
    };

    const lift = (leaf: CurlLeaf, heldAt: number, heading: 1 | -1): CurlHold => {
      const corner = curlCornerOf(leaf, heldAt);
      const away = curlAwayOf(leaf, corner);
      const start = heading === 1 ? corner : away;

      x.stop();
      y.stop();
      x.set(start.x);
      y.set(start.y);

      return { heading, leaf, corner, away };
    };

    const pull = (hold: CurlHold, across: number, down: number) => {
      const pulled =
        hold.heading === 1
          ? { x: hold.corner.x + across, y: hold.corner.y + down }
          : { x: hold.away.x + 2 * across, y: hold.away.y + down };
      const reached = clampCurl(hold.leaf, hold.corner, pulled);

      x.set(reached.x);
      y.set(reached.y);
    };

    const carry = (hold: CurlHold, turns: boolean, onDone: () => void) => {
      const began = generation.current;
      const to = (hold.heading === 1) === turns ? hold.away : hold.corner;
      const how = { duration: TURN_SECONDS, ease: PAGE_TURN.curls.ease };

      void animate(y, to.y, how);
      void animate(x, to.x, {
        ...how,
        onComplete: () => {
          if (generation.current === began) {
            onDone();
          }
        },
      });
    };

    const sweep = (hold: CurlHold, seconds: number, onDone: () => void) => {
      const began = generation.current;
      const from = hold.heading === 1 ? hold.corner : hold.away;
      const to = hold.heading === 1 ? hold.away : hold.corner;
      const rise =
        (hold.corner.y === hold.leaf.y ? 1 : -1) * hold.leaf.height * PAGE_TURN.curls.rises;

      void animate(0, 1, {
        duration: seconds,
        ease: PAGE_TURN.curls.ease,
        onUpdate: (share) => {
          const at = curlArcAt(from, to, rise, share);

          x.set(at.x);
          y.set(at.y);
        },
        onComplete: () => {
          if (generation.current === began) {
            onDone();
          }
        },
      });
    };

    return { x, y, lift, pull, carry, sweep, stop };
  }, [x, y]);
};

export { useCurlTurn };
