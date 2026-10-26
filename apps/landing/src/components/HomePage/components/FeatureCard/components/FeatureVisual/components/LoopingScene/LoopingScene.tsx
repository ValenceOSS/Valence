import { useEffect, useRef, useState } from 'react';
import { Thumbnail } from '@remotion/player';
import { useInView, useReducedMotionConfig } from 'motion/react';
import { cn } from '@ValenceUI/cn';
import { STAGE } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/STAGE';
import type { LoopingSceneProps, SceneAnchor } from './LoopingScene.types';

const FPS = 30;

const PINNED: Readonly<Record<SceneAnchor, string>> = {
  left: 'left-0',
  right: 'right-0',
  centre: 'left-1/2 -translate-x-1/2',
};

/**
 * A feature acted out as a short scene that plays round and round while its card is on screen, and
 * stops when it is not, so a page of cards is not all moving at once off in the dark. Drawn on a
 * stage at the app's own size and pinned to one side of its card, so its words read as large as
 * the app's however narrow the card is, and the far side runs off the edge. For somebody
 * who asked for less motion it is one telling frame of it, held still.
 *
 * The scene is drawn a frame at a time from a clock of its own rather than by a player, because a
 * player that starts itself is autoplay to a browser, and a browser that blocks autoplay left every
 * card on its first, empty frame.
 *
 * @param scene - The scene, drawn from the frame it is on.
 * @param frames - How long one time round is, at thirty frames a second.
 * @param still - The frame shown to somebody who asked for less motion.
 * @param startsAt - The frame it starts from, so cards side by side are not all in step.
 * @param anchor - Which side of the card the stage is pinned to, and so stays in view.
 */
const LoopingScene = ({ scene, frames, still, startsAt = 0, anchor }: LoopingSceneProps) => {
  const holder = useRef<HTMLDivElement>(null);
  const isInView = useInView(holder, { amount: 0.2 });
  const isStill = useReducedMotionConfig() === true;
  const [frame, setFrame] = useState(isStill ? still : startsAt % frames);
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
    <div
      ref={holder}
      style={{ width: STAGE.width, height: STAGE.height }}
      className={cn('absolute top-0', PINNED[anchor])}
      data-scene-frame=""
    >
      <Thumbnail
        component={scene}
        durationInFrames={frames}
        fps={FPS}
        compositionWidth={STAGE.width}
        compositionHeight={STAGE.height}
        frameToDisplay={isStill ? still : frame}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
};

LoopingScene.displayName = 'LoopingScene';

export { LoopingScene };
