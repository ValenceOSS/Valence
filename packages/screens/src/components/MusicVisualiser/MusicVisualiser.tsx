import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotionConfig } from 'motion/react';
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Maximize as MaximizeIcon,
  Minimize as MinimizeIcon,
  X as XIcon,
} from '@keyline-icons/react';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import { cn } from '@ValenceUI/cn';
import { VisualiserStage } from '@ValenceUI/VisualiserStage';
import { setMusicVisualiser, useMusicVisualiser } from '@ValenceScreens/music/musicVisualiser';
import { theMusicAudio, theMusicPlayer } from '@ValenceScreens/music/theMusicPlayer';
import { useAudioFrames } from '@ValenceScreens/music/useAudioFrames';
import { useMusicPlayer } from '@ValenceScreens/music/useMusicPlayer';
import { useWhatIsPlaying } from '@ValenceClient/music/useWhatIsPlaying';
import { VISUALISERS } from '@ValenceScreens/music/visualisers/VISUALISERS';
import {
  readVisualiserChoice,
  saveVisualiserChoice,
} from '@ValenceScreens/music/visualiserPreference';
import { useChromeThatHides } from '@ValenceScreens/reading/useChromeThatHides';
import { useFullscreen } from '@ValenceScreens/reading/useFullscreen';
import type { MusicVisualiserProps } from './MusicVisualiser.types';

const FADING = { duration: 0.25, ease: [0.23, 1, 0.32, 1] } as const;

const HUE_DRIFT_PER_SECOND = 6;

/**
 * The song playing as nothing but a picture of its sound, filling the screen, in the way media
 * players once gave their whole window over to one — bars, waves, drifting light, a ring, a rush of
 * stars.
 *
 * There is no interface while it is being watched. The controls — the visualiser's name with a step
 * to each side, full screen and a way out — show on arrival and when the pointer moves, and fade
 * away after a moment with the pointer, leaving only the picture. The left and right arrow keys
 * change visualiser without them, and Escape leaves. The one somebody last chose comes back the next
 * time.
 *
 * It listens to the music the same way the immersive view does, and where the browser will not
 * allow that it says so instead of drawing a picture of silence. It is not shown to anybody who has
 * asked for less movement, and it closes itself when nothing is playing.
 *
 * @param player - The player to listen to, which is the window's own unless a test says otherwise.
 */
const MusicVisualiser = ({ player: given }: MusicVisualiserProps) => {
  const isOpen = useMusicVisualiser();
  const { state } = useMusicPlayer(given ?? theMusicPlayer());
  const shown = useWhatIsPlaying(state);
  const isStill = useReducedMotionConfig() === true;
  const [at, setAt] = useState(readVisualiserChoice);
  const holder = useRef<HTMLElement>(null);
  const { isFullscreen, isAvailable, toggle } = useFullscreen(holder);
  const { isShown, wake } = useChromeThatHides();
  const isListeningFor = isOpen && shown !== null;
  const { isListening, read } = useAudioFrames(isListeningFor ? theMusicAudio() : null, isOpen);
  const visualiser = VISUALISERS[at] ?? VISUALISERS[0];
  const draw = useMemo(() => visualiser?.create(), [visualiser]);

  const paint = useCallback(
    (
      context: CanvasRenderingContext2D,
      size: { width: number; height: number },
      time: { seconds: number; delta: number },
    ) => {
      draw?.(context, read(size, time, (time.seconds * HUE_DRIFT_PER_SECOND) % 360));
    },
    [draw, read],
  );

  const step = useCallback((by: number) => {
    setAt((was) => {
      const next = (was + by + VISUALISERS.length) % VISUALISERS.length;

      saveVisualiserChoice(next);

      return next;
    });
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopImmediatePropagation();
        setMusicVisualiser(false);
      } else if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault();
        step(event.key === 'ArrowLeft' ? -1 : 1);
      }
    };

    window.addEventListener('keydown', onKey, { capture: true });

    return () => {
      window.removeEventListener('keydown', onKey, { capture: true });
    };
  }, [isOpen, step]);

  useEffect(() => {
    if (isOpen) {
      wake();
    }
  }, [isOpen, wake]);

  useEffect(() => {
    if (shown === null && isOpen) {
      setMusicVisualiser(false);
    }
  }, [shown, isOpen]);

  const isDrawn = isOpen && shown !== null && !isStill;

  return (
    <AnimatePresence>
      {!isDrawn || visualiser === undefined ? null : (
        <motion.section
          ref={holder}
          key="visualiser"
          aria-label={`${visualiser.name}, visualiser`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={FADING}
          className={cn(
            'fixed inset-x-0 bottom-0 top-[var(--valence-window-bar)] z-[40] overflow-hidden bg-scrim text-on-scrim',
            !isShown && 'cursor-none',
          )}
          onPointerMove={wake}
          onPointerDown={wake}
          onKeyDown={wake}
        >
          <VisualiserStage draw={paint} className="absolute inset-0" />

          {isListening ? null : (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ ...FADING, delay: 0.8 }}
              className="pointer-events-none absolute inset-x-6 bottom-[calc(2rem+env(safe-area-inset-bottom,0px))] text-center text-sm text-on-scrim/70"
            >
              This browser can’t listen to this song, so there is nothing to draw.
            </motion.p>
          )}

          <AnimatePresence>
            {isShown ? (
              <motion.div
                key="controls"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={FADING}
                className="absolute inset-x-0 top-0 flex items-center justify-between gap-3 bg-gradient-to-b from-scrim/60 to-transparent px-4 pt-[calc(1rem+env(safe-area-inset-top,0px))] pb-10"
              >
                <div className="flex items-center gap-1">
                  <Button
                    variant="overlay"
                    isIconOnly
                    label="Previous visualiser"
                    onClick={() => {
                      step(-1);
                    }}
                  >
                    <Icon of={ChevronLeftIcon} size={20} />
                  </Button>
                  <p
                    aria-live="polite"
                    className="min-w-32 text-center text-sm font-medium tabular-nums"
                  >
                    {visualiser.name}
                  </p>
                  <Button
                    variant="overlay"
                    isIconOnly
                    label="Next visualiser"
                    onClick={() => {
                      step(1);
                    }}
                  >
                    <Icon of={ChevronRightIcon} size={20} />
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  {isAvailable ? (
                    <Button
                      variant="overlay"
                      isIconOnly
                      label={isFullscreen ? 'Leave full screen' : 'Full screen'}
                      onClick={toggle}
                    >
                      <Icon of={isFullscreen ? MinimizeIcon : MaximizeIcon} size={20} />
                    </Button>
                  ) : null}
                  <Button
                    variant="overlay"
                    isIconOnly
                    label="Close visualiser"
                    onClick={() => {
                      setMusicVisualiser(false);
                    }}
                  >
                    <Icon of={XIcon} size={20} />
                  </Button>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </motion.section>
      )}
    </AnimatePresence>
  );
};

MusicVisualiser.displayName = 'MusicVisualiser';

export { MusicVisualiser };
