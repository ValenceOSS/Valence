import { Pause as PauseIcon, Play as PlayIcon } from '@keyline-icons/react/fill';
import { AnimatePresence, motion, useReducedMotionConfig } from 'motion/react';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import { fadeVariants, revealTransition } from '@ValenceUI/animations/reveal';
import { albumArtworkUrl } from '@ValenceClient/music/fetchMusic';
import { MusicArtwork } from '@ValenceScreens/components/MusicArtwork/MusicArtwork';
import type { MusicMiniPlayerProps } from './MusicMiniPlayer.types';

const ARRIVING = {
  hidden: { opacity: 0, y: '20%' },
  shown: { opacity: 1, y: 0 },
  gone: { opacity: 0, y: '20%' },
};

/**
 * What is playing, shrunk to a corner, for every page that is not the one music already owns.
 *
 * The full bar names every control music has; away from the music section none of that is what
 * somebody came here for, and a page that gave it the same room as the library would be a page that
 * put music ahead of whatever was actually asked for. This says only what is playing and offers only
 * the one thing worth reaching for without leaving — pressing pause — and opens the real bar for
 * anything more than that.
 *
 * Sat in the corner rather than spanning the foot, so it reads as a note about something happening
 * elsewhere rather than as this page's own transport.
 *
 * @param shown - What is playing.
 * @param onOpen - Told to take somebody to the music section.
 * @param onTogglePlay - Told to pause or resume without leaving the page.
 */
const MusicMiniPlayer = ({ shown, onOpen, onTogglePlay }: MusicMiniPlayerProps) => {
  const prefersReducedMotion = useReducedMotionConfig();
  const isStill = prefersReducedMotion === true;
  const arriving = revealTransition(prefersReducedMotion, 'heavy');

  return (
    <AnimatePresence>
      <motion.div
        key="mini-player"
        variants={isStill ? fadeVariants : ARRIVING}
        initial="hidden"
        animate="shown"
        exit="gone"
        transition={arriving}
        className="pointer-events-none fixed bottom-4 left-4 z-40 pb-[env(safe-area-inset-bottom,0px)]"
      >
        <div className="valence-card-shell pointer-events-auto">
          <div className="valence-card-face valence-card-face--raised flex items-center gap-2 p-2 pr-3">
            <Button
              variant="bare"
              size="none"
              label={`Open ${shown.title}`}
              hasTooltip={false}
              className="flex min-w-0 items-center gap-2"
              onClick={onOpen}
            >
              <MusicArtwork
                src={shown.hasArtwork ? albumArtworkUrl(shown.albumId) : null}
                label={shown.albumTitle ?? shown.title}
                className="size-10 shrink-0"
              />

              <span className="flex min-w-0 flex-col items-start">
                <span className="max-w-36 truncate text-[0.8125rem] font-semibold text-text">
                  {shown.title}
                </span>
                <span className="max-w-36 truncate text-xs text-text-muted">
                  {shown.artists.map((artist) => artist.name).join(', ')}
                </span>
              </span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              isIconOnly
              label={shown.isPlaying ? 'Pause' : 'Play'}
              onClick={onTogglePlay}
            >
              <Icon of={shown.isPlaying ? PauseIcon : PlayIcon} size={16} />
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

MusicMiniPlayer.displayName = 'MusicMiniPlayer';

export { MusicMiniPlayer };
