import { useEffect, useRef } from 'react';
import { motion, useReducedMotionConfig } from 'motion/react';
import { Button } from '@ValenceUI/Button';
import { cn } from '@ValenceUI/cn';
import { liquidSpring, stillTransition } from '@ValenceUI/animations/reveal';
import type { LyricLinesProps } from './LyricLines.types';

const BLUR_PER_LINE = 1.4;

const BLUR_MOST = 6;

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
 * always led to the right place without anything jumping. In the immersive look the lines further
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

  useEffect(() => {
    lineRefs.current.get(at)?.scrollIntoView({
      block: 'center',
      behavior: isStill ? 'auto' : 'smooth',
    });
  }, [at, isStill]);

  return (
    <ol className="flex flex-col gap-4 sm:gap-6">
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
  );
};

LyricLines.displayName = 'LyricLines';

export { LyricLines, standingOf };
