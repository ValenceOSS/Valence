import { useEffect } from 'react';
import { ChevronUp as ChevronUpIcon, X as XIcon } from '@keyline-icons/react';
import {
  Pause as PauseFilledIcon,
  Play as PlayFilledIcon,
  RotateCcw as RotateCcwFilledIcon,
  RotateCw as RotateCwFilledIcon,
} from '@keyline-icons/react/fill';
import { useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion, useReducedMotionConfig } from 'motion/react';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import { PopoverPanel } from '@ValenceUI/PopoverPanel';
import { Spinner } from '@ValenceUI/Spinner';
import { fadeVariants, revealTransition } from '@ValenceUI/animations/reveal';
import { bookCoverUrl } from '@ValenceClient/books/fetchBooks';
import { bookQueries } from '@ValenceClient/query/bookQueries';
import { BarButton } from '@ValenceScreens/components/BarButton/BarButton';
import { MusicArtwork } from '@ValenceScreens/components/MusicArtwork/MusicArtwork';
import { chapterPlaying } from '@ValenceScreens/listening/chapterPlaying';
import { theAudiobookPlayer } from '@ValenceScreens/listening/theAudiobookPlayer';
import { useAudiobookPlayer } from '@ValenceScreens/listening/useAudiobookPlayer';
import {
  BACK_SECONDS,
  FORWARD_SECONDS,
  useAudiobookSession,
} from '@ValenceScreens/listening/useAudiobookSession';
import { AudiobookPanel } from './components/AudiobookPanel/AudiobookPanel';
import type { AudiobookBarProps } from './AudiobookBar.types';

const ARRIVING = {
  hidden: { opacity: 0, y: '20%' },
  shown: { opacity: 1, y: 0 },
  gone: { opacity: 0, y: '20%' },
};

/**
 * The audiobook playing, in the corner of every page: its cover, the chapter it is on, back fifteen
 * seconds, play and pause, and on thirty — and, opened, everything else there is to do with it.
 *
 * Sat in the other corner from the music's own and above the music's bar, so the two never cover
 * each other; the two players take turns, each pausing the other as it starts. Closing it keeps
 * where somebody had got to, and anything listing what they are listening to is asked again as it
 * pauses or closes, so "continue listening" says where they stopped.
 *
 * @param player - The player to drive, which is the window's own unless a test says otherwise.
 */
const AudiobookBar = ({ player: given }: AudiobookBarProps) => {
  const { state, player } = useAudiobookPlayer(given ?? theAudiobookPlayer());
  const queries = useQueryClient();
  const prefersReducedMotion = useReducedMotionConfig();
  const arriving = revealTransition(prefersReducedMotion, 'heavy');
  const { book } = state;
  const bookId = book?.id ?? null;
  const chapter = state.chapters[chapterPlaying(state)];

  useAudiobookSession(state, player);

  useEffect(() => {
    if (bookId === null || !state.isPlaying) {
      void queries.invalidateQueries({ queryKey: bookQueries.listening().queryKey });

      if (bookId !== null) {
        void queries.invalidateQueries({
          queryKey: bookQueries.listeningPlace(bookId).queryKey,
        });
      }
    }
  }, [bookId, state.isPlaying, queries]);

  return (
    <AnimatePresence>
      {book === null ? null : (
        <motion.div
          key="audiobook-bar"
          variants={prefersReducedMotion === true ? fadeVariants : ARRIVING}
          initial="hidden"
          animate="shown"
          exit="gone"
          transition={arriving}
          className="pointer-events-none fixed right-4 bottom-[calc(var(--music-bar-room,0px)+1rem)] z-40 max-w-[calc(100vw-2rem)] pb-[env(safe-area-inset-bottom,0px)]"
        >
          <section aria-label="Listening to" className="valence-card-shell pointer-events-auto">
            <div className="valence-card-face valence-card-face--raised flex items-center gap-2 p-2">
              <MusicArtwork
                src={book.hasCover ? bookCoverUrl(book.id) : null}
                label={book.title}
                className="size-10 shrink-0"
              />

              <span className="flex min-w-0 flex-col">
                <span className="max-w-40 truncate text-[0.8125rem] font-semibold text-text">
                  {book.title}
                </span>
                <span className="max-w-40 truncate text-xs text-text-muted">
                  {chapter?.title ?? book.authors?.join(', ') ?? ''}
                </span>
              </span>

              <div className="flex shrink-0 items-center">
                <BarButton
                  label={`Back ${BACK_SECONDS.toString()} seconds`}
                  glyph={RotateCcwFilledIcon}
                  onClick={() => {
                    player.skip(-BACK_SECONDS);
                  }}
                />

                <Button
                  variant="confirm"
                  size="sm"
                  isIconOnly
                  label={state.isPlaying ? 'Pause' : 'Play'}
                  className="size-8"
                  onClick={() => {
                    player.toggle();
                  }}
                >
                  {state.isLoading && state.isPlaying ? (
                    <Spinner size="sm" label="Loading" />
                  ) : (
                    <Icon of={state.isPlaying ? PauseFilledIcon : PlayFilledIcon} size={16} />
                  )}
                </Button>

                <BarButton
                  label={`On ${FORWARD_SECONDS.toString()} seconds`}
                  glyph={RotateCwFilledIcon}
                  onClick={() => {
                    player.skip(FORWARD_SECONDS);
                  }}
                />

                <PopoverPanel
                  label="Open the player"
                  heading={book.title}
                  trigger={<Icon of={ChevronUpIcon} size={18} />}
                >
                  <AudiobookPanel state={state} player={player} />
                </PopoverPanel>

                <BarButton
                  label="Stop listening"
                  glyph={XIcon}
                  onClick={() => {
                    player.close();
                  }}
                />
              </div>
            </div>
          </section>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

AudiobookBar.displayName = 'AudiobookBar';

export { AudiobookBar };
