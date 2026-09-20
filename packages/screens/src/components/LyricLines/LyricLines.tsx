import { AudioLines as AudioLinesFilledIcon } from '@keyline-icons/react/fill';
import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, useReducedMotionConfig } from 'motion/react';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import { cn } from '@ValenceUI/cn';
import { liquidSpring, stillTransition } from '@ValenceUI/animations/reveal';
import type { LyricLinesProps } from './LyricLines.types';

const BLUR_PER_LINE = 1.4;

const BLUR_MOST = 6;

const SCROLLING_KEYS: ReadonlySet<string> = new Set([
  'ArrowUp',
  'ArrowDown',
  'PageUp',
  'PageDown',
  'Home',
  'End',
  ' ',
]);

/**
 * The box a line scrolls within: the nearest thing around it that scrolls up and down.
 *
 * Only that box is moved to keep the sung line in sight. Asking the browser to bring a line into
 * view moves every box around it that can move, the page itself included, which on a page built not
 * to scroll shifts everything under the bar at the top.
 *
 * @param line - The line.
 * @returns The box, or nothing where nothing around it scrolls.
 */
const scrollerOf = (line: HTMLElement): HTMLElement | null => {
  for (let at = line.parentElement; at !== null; at = at.parentElement) {
    const { overflowY } = getComputedStyle(at);

    if (overflowY === 'auto' || overflowY === 'scroll') {
      return at;
    }
  }

  return null;
};

/**
 * How a line stands, given where it is against the line being sung.
 *
 * @param index - The line.
 * @param at - The line being sung, or -1 where the words are not timed.
 * @param isSynced - Whether the words are timed at all.
 * @param isImmersive - Whether lines away from the one sung are blurred as well as dimmed.
 * @returns How visible, how large and how blurred to draw it.
 */
const standingOf = (
  index: number,
  at: number,
  isSynced: boolean,
  isImmersive: boolean,
): { opacity: number; scale: number; blur: number } => {
  if (!isSynced) {
    return { opacity: 0.9, scale: 1, blur: 0 };
  }

  if (index === at) {
    return { opacity: 1, scale: 1, blur: 0 };
  }

  const away = Math.abs(index - at);

  return {
    opacity: index < at ? 0.35 : 0.6,
    scale: 0.96,
    blur: isImmersive ? Math.min(away * BLUR_PER_LINE, BLUR_MOST) : 0,
  };
};

/**
 * A song's words, one line under another, following along with the music.
 *
 * The line being sung comes up to full size and brightness and the page glides to keep it in the
 * middle; the lines around it ease back — sung ones dimmer than those to come — so the eye is
 * always led to the right place without anything jumping. Only the box the words scroll in moves to
 * keep the sung line in sight — never the page around it. In the immersive look the lines further
 * from the one sung also go out of focus, which keeps a screen full of words from reading as a
 * wall of text. Pressing a timed line goes to it. Somebody who has asked for less movement sees
 * lines brighten and dim with nothing growing, blurring or gliding.
 *
 * @param lyrics - The words, and whether they are timed.
 * @param at - The line being sung, or -1.
 * @param onSeek - Told to go to a line's moment in the song.
 * @param look - On a page of its own, or immersive over the song's cover.
 */
const LyricLines = ({ lyrics, at, onSeek, look = 'page' }: LyricLinesProps) => {
  const prefersReducedMotion = useReducedMotionConfig();
  const isStill = prefersReducedMotion === true;
  const lineRefs = useRef(new Map<number, HTMLElement>());
  const listRef = useRef<HTMLOListElement | null>(null);
  const [isDetached, setIsDetached] = useState(false);

  const goToSung = useCallback(() => {
    const line = lineRefs.current.get(at);
    const scroller = line === undefined ? null : scrollerOf(line);

    if (line === undefined || scroller === null) {
      return;
    }

    const shown = scroller.getBoundingClientRect();
    const sung = line.getBoundingClientRect();

    scroller.scrollBy({
      top: sung.top + sung.height / 2 - (shown.top + shown.height / 2),
      behavior: isStill ? 'auto' : 'smooth',
    });
  }, [at, isStill]);

  useEffect(() => {
    if (!isDetached) {
      goToSung();
    }
  }, [at, isStill, isDetached, goToSung]);

  useEffect(() => {
    setIsDetached(false);
  }, [lyrics]);

  useEffect(() => {
    const list = listRef.current;
    const scroller = list === null ? null : scrollerOf(list);

    if (scroller === null || !lyrics.isSynced) {
      return;
    }

    const detach = () => {
      setIsDetached(true);
    };

    const onKey = (event: KeyboardEvent) => {
      if (SCROLLING_KEYS.has(event.key)) {
        detach();
      }
    };

    scroller.addEventListener('wheel', detach, { passive: true });
    scroller.addEventListener('touchmove', detach, { passive: true });
    scroller.addEventListener('keydown', onKey);

    return () => {
      scroller.removeEventListener('wheel', detach);
      scroller.removeEventListener('touchmove', detach);
      scroller.removeEventListener('keydown', onKey);
    };
  }, [lyrics.isSynced]);

  return (
    <>
      <ol ref={listRef} className="flex flex-col gap-4 sm:gap-6">
        {lyrics.lines.map((line, index) => {
          const { atMs } = line;
          const standing = standingOf(index, at, lyrics.isSynced, look === 'immersive');
          const words = line.text === '' ? '♪' : line.text;
          const drawn = cn(
            'origin-left text-left font-bold leading-[1.12] tracking-[-0.025em]',
            look === 'immersive'
              ? 'text-[clamp(1.75rem,4vw,3.5rem)]'
              : 'text-[clamp(1.5rem,3.6vw,3rem)]',
          );

          return (
            <motion.li
              key={`${index.toString()}-${line.text}`}
              ref={(element: HTMLLIElement | null) => {
                if (element === null) {
                  lineRefs.current.delete(index);
                } else {
                  lineRefs.current.set(index, element);
                }
              }}
              initial={false}
              animate={{
                opacity: standing.opacity,
                scale: isStill ? 1 : standing.scale,
                filter: `blur(${(isStill ? 0 : standing.blur).toString()}px)`,
              }}
              transition={
                isStill
                  ? stillTransition
                  : { ...liquidSpring, opacity: stillTransition, filter: stillTransition }
              }
              className="origin-left"
              {...(index === at ? { 'aria-current': 'true' } : {})}
            >
              {atMs === null ? (
                <p className={drawn}>{words}</p>
              ) : (
                <Button
                  variant="bare"
                  size="none"
                  hasTooltip={false}
                  className={drawn}
                  onClick={() => {
                    onSeek(atMs / 1000);
                  }}
                >
                  {words}
                </Button>
              )}
            </motion.li>
          );
        })}
      </ol>

      {isDetached && at >= 0 ? (
        <div className="pointer-events-none sticky bottom-6 z-10 mt-6 flex justify-center">
          <Button
            variant="confirm"
            size="md"
            className="pointer-events-auto"
            onClick={() => {
              setIsDetached(false);
            }}
          >
            Sync
            <Icon of={AudioLinesFilledIcon} size={16} />
          </Button>
        </div>
      ) : null}
    </>
  );
};

LyricLines.displayName = 'LyricLines';

export { LyricLines, standingOf };
