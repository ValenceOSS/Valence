import { useEffect, useRef, useState } from 'react';
import { Thumbnail } from '@remotion/player';
import { useInView, useReducedMotionConfig } from 'motion/react';
import type { LoopingSceneProps } from './LoopingScene.types';

const FPS = 30;

/**
 * A feature acted out as a short scene that plays round and round while its card is on screen, and
 * stops when it is not, so a page of cards is not all moving at once off in the dark. Drawn at a
 * fixed size and scaled to its card, so it reads the same however wide the card is. For somebody
 * who asked for less motion it is one telling frame of it, held still.
 *
 * The scene is drawn a frame at a time from a clock of its own rather than by a player, because a
 * player that starts itself is autoplay to a browser, and a browser that blocks autoplay left every
 * card on its first, empty frame.
 *
 * @param scene - The scene, drawn from the frame it is on.
 * @param frames - How long one time round is, at thirty frames a second.
 * @param width - How wide the scene is drawn before it is scaled.
 * @param height - How tall the scene is drawn before it is scaled.
 * @param still - The frame shown to somebody who asked for less motion.
 * @param className - Extra classes for the card's own layout.
 */
const LoopingScene = ({ scene, frames, width, height, still, className }: LoopingSceneProps) => {
  const holder = useRef<HTMLDivElement>(null);
  const isInView = useInView(holder, { amount: 0.2 });
  const isStill = useReducedMotionConfig() === true;
  const [frame, setFrame] = useState(isStill ? still : 0);
  const startedAt = useRef<number | null>(null);
  const shownFrame = useRef(frame);

  useEffect(() => {
    if (isStill || !isInView) {
      startedAt.current = null;

      return;
    }

    let request = 0;

    const tick = (now: number) => {
      startedAt.current ??= now - (shownFrame.current / FPS) * 1000;

      const next = Math.floor(((now - startedAt.current) / 1000) * FPS) % frames;

      if (next !== shownFrame.current) {
        shownFrame.current = next;
        setFrame(next);
      }

      request = requestAnimationFrame(tick);
    };

    request = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(request);
    };
  }, [isInView, isStill, frames]);

  return (
    <div ref={holder} className={className}>
      <Thumbnail
        component={scene}
        durationInFrames={frames}
        fps={FPS}
        compositionWidth={width}
        compositionHeight={height}
        frameToDisplay={isStill ? still : frame}
        style={{ width: '100%' }}
      />
    </div>
  );
};

LoopingScene.displayName = 'LoopingScene';

export { LoopingScene };
