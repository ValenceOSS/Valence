import { useCallback, useEffect, useRef, useState } from 'react';
import { useInView, useReducedMotionConfig } from 'motion/react';
import { PageCurl } from '@ValenceUI/PageCurl';
import { ProgressBar } from '@ValenceUI/ProgressBar';
import { useCurlTurn } from '@ValenceUI/useCurlTurn';
import { usePageDrag } from '@ValenceUI/usePageDrag';
import { isCurlPull } from '@ValenceCore/functions/isCurlPull';
import { turnOfPageSwipe } from '@ValenceCore/functions/turnOfPageSwipe';
import { BookPage } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/components/ReaderVignette/components/BookPage/BookPage';
import type { CurlHold, CurlLeaf } from '@ValenceCore/functions/pageCurl.types';

const PAGES = [
  [
    'The tide had left the road by noon, and the salt lay on it in a crust',
    'that broke under the cart wheels like frost. Ines walked ahead of the',
    'mule, counting the stones that marked each mile.',
  ],
  [
    'By the fourth stone the lighthouse had come up out of the haze, white',
    'and further off than it had any right to be. She stopped, and for the',
    'first time that day let herself wonder who had lit it.',
  ],
  [
    'The mule did not wonder. It found the one tuft of grass for a mile in',
    'either direction and set about it, and Ines let it, because the light',
    'was not going anywhere, and neither, it seemed, was she.',
  ],
  [
    'When they moved on the sun had gone round behind the tower, and its',
    'shadow reached down the road to meet them like a hand held out, long',
    'and thin and very nearly kind.',
  ],
] as const;

const FIRST_PAGE = 212;

const FIRST_SHARE = 64;

const SHARE_PER_PAGE = 2;

const PAUSE_MS = 2600;

const SWEEP_SECONDS = 1.1;

/**
 * A book open in the reader, turning its own pages with the reader's page curl while it is in view,
 * a page every few seconds, the progress through the book ticking on with each. It can be taken
 * hold of by its corner and turned by hand exactly as in the reader, the corner following the
 * pointer and going over or falling back when let go, and it waits while it is held. For somebody
 * who asked for less motion it is simply a page.
 */
const ReaderVignette = () => {
  const isStill = useReducedMotionConfig() === true;
  const stage = useRef<HTMLDivElement | null>(null);
  const isInView = useInView(stage, { amount: 0.6 });
  const curl = useCurlTurn();
  const [turns, setTurns] = useState(0);
  const [hold, setHold] = useState<CurlHold | null>(null);
  const holdRef = useRef<CurlHold | null>(null);

  const settle = useCallback((next: CurlHold | null) => {
    holdRef.current = next;
    setHold(next);
  }, []);

  const leafNow = useCallback(
    (): CurlLeaf => ({
      x: 0,
      y: 0,
      width: Math.max(stage.current?.offsetWidth ?? 1, 1),
      height: Math.max(stage.current?.offsetHeight ?? 1, 1),
      spine: 'left',
    }),
    [],
  );

  const turned = useCallback(() => {
    setTurns((was) => was + 1);
    settle(null);
  }, [settle]);

  useEffect(() => {
    if (isStill || !isInView || hold !== null) {
      return;
    }

    const timer = setTimeout(() => {
      const leaf = leafNow();
      const lifted = curl.lift(leaf, leaf.height, 1);

      settle(lifted);
      curl.sweep(lifted, SWEEP_SECONDS, turned);
    }, PAUSE_MS);

    return () => {
      clearTimeout(timer);
    };
  }, [isStill, isInView, hold, turns, curl, leafNow, settle, turned]);

  useEffect(
    () => () => {
      curl.stop();
    },
    [curl],
  );

  const drag = usePageDrag({
    isOn: !isStill,
    isMouseAllowed: true,
    isPull: isCurlPull,
    reach: () => Math.max(stage.current?.offsetWidth ?? 1, 1),
    mayMove: (towards) => towards === -1,
    onMove: (across, down, heldAt) => {
      let held = holdRef.current;

      if (held === null) {
        if (across >= 0) {
          return;
        }

        held = curl.lift(
          leafNow(),
          heldAt.y - (stage.current?.getBoundingClientRect().top ?? 0),
          1,
        );
        settle(held);
      }

      curl.pull(held, across, down);
    },
    onRelease: (offset, velocity) => {
      const held = holdRef.current;

      if (held === null) {
        return;
      }

      const isTurned = turnOfPageSwipe(offset, velocity) === -1;

      curl.carry(held, isTurned, () => {
        if (isTurned) {
          turned();
        } else {
          settle(null);
        }
      });
    },
  });

  const pageAt = (turn: number) => (
    <BookPage lines={PAGES[turn % PAGES.length] ?? []} number={FIRST_PAGE + turn} />
  );

  return (
    <div className="flex w-full max-w-[calc(var(--vignette-width)*0.8)] flex-col gap-3">
      <div
        ref={stage}
        className="valence-float relative aspect-[4/3] w-full cursor-grab touch-pan-y select-none overflow-hidden rounded-r-lg active:cursor-grabbing"
        {...drag}
      >
        {hold === null ? (
          pageAt(turns)
        ) : (
          <PageCurl
            leaf={hold.leaf}
            corner={hold.corner}
            x={curl.x}
            y={curl.y}
            under={pageAt(turns + 1)}
            front={pageAt(turns)}
            back={pageAt(turns)}
            isBackFacing={false}
          />
        )}
      </div>

      <ProgressBar
        label="Through the book"
        value={FIRST_SHARE + (turns % 10) * SHARE_PER_PAGE}
        isFull
        readout={`${(FIRST_SHARE + (turns % 10) * SHARE_PER_PAGE).toString()}%`}
      />
    </div>
  );
};

ReaderVignette.displayName = 'ReaderVignette';

export { ReaderVignette };
