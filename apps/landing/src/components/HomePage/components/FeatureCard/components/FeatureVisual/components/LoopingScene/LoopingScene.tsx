import { useEffect, useRef } from 'react';
import { Player } from '@remotion/player';
import { useInView, useReducedMotionConfig } from 'motion/react';
import type { PlayerRef } from '@remotion/player';
import type { LoopingSceneProps } from './LoopingScene.types';

const FPS = 30;

/**
 * A feature acted out as a short scene that plays round and round while its card is on screen, and
 * stops when it is not, so a page of cards is not all moving at once off in the dark. Drawn at a
 * fixed size and scaled to its card, so it reads the same however wide the card is. For somebody
 * who asked for less motion it is one telling frame of it, held still.
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
  const player = useRef<PlayerRef>(null);
  const isInView = useInView(holder, { amount: 0.4 });
  const isStill = useReducedMotionConfig() === true;

  useEffect(() => {
    const playing = player.current;

    if (playing === null || isStill) {
      return;
    }

    if (isInView) {
      playing.play();
    } else {
      playing.pause();
    }
  }, [isInView, isStill]);

  return (
    <div ref={holder} className={className}>
      <Player
        ref={player}
        component={scene}
        durationInFrames={frames}
        fps={FPS}
        compositionWidth={width}
        compositionHeight={height}
        initialFrame={isStill ? still : 0}
        loop
        controls={false}
        clickToPlay={false}
        doubleClickToFullscreen={false}
        spaceKeyToPlayOrPause={false}
        style={{ width: '100%' }}
      />
    </div>
  );
};

LoopingScene.displayName = 'LoopingScene';

export { LoopingScene };
