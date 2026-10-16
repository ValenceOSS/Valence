import { useEffect, useRef } from 'react';
import { motion, useReducedMotionConfig } from 'motion/react';
import { Button } from '@ValenceUI/Button';
import { VideoSurface } from '@ValenceUI/VideoSurface';
import type { PreRollProps } from './PreRoll.types';
import { say } from '@ValenceI18n/say';

const GIVES_UP_AFTER_MILLISECONDS = 6_000;

/**
 * The clip played before a film or episode, filling the screen, with a way to skip it. It hands on
 * to the title when it ends, when it is skipped, and when it cannot be played at all — a clip the
 * browser refuses, or one that has not started within a few seconds — so a pre-roll can only ever
 * delay a title, never stop it.
 *
 * @param address - Where the clip is.
 * @param label - What is about to play, read out over the clip.
 * @param onDone - Told once the title should start.
 */
const PreRoll = ({ address, label, onDone }: PreRollProps) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const prefersReducedMotion = useReducedMotionConfig();

  useEffect(() => {
    const element = videoRef.current;

    if (element === null) {
      onDone();

      return undefined;
    }

    const givesUp = setTimeout(onDone, GIVES_UP_AFTER_MILLISECONDS);
    const started = () => {
      clearTimeout(givesUp);
    };

    element.addEventListener('playing', started);
    element.addEventListener('error', onDone);
    element.play().catch(onDone);

    return () => {
      clearTimeout(givesUp);
      element.removeEventListener('playing', started);
      element.removeEventListener('error', onDone);
    };
  }, [onDone]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: prefersReducedMotion === true ? 0 : 0.3 }}
      className="relative flex h-full w-full items-center justify-center bg-shade"
    >
      <VideoSurface
        label={label}
        src={address}
        videoRef={videoRef}
        onEnded={onDone}
        className="h-full w-full object-contain"
      />

      <div className="absolute right-6 bottom-6">
        <Button variant="secondary" size="sm" onClick={onDone}>
          {say('common.skip')}
        </Button>
      </div>
    </motion.div>
  );
};

PreRoll.displayName = 'PreRoll';

export { PreRoll };
