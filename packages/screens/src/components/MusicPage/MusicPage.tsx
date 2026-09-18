import { Cancel01Icon } from '@hugeicons/core-free-icons';
import { AnimatePresence, motion, useReducedMotionConfig } from 'motion/react';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import { cn } from '@ValenceUI/cn';
import { fadeVariants, revealItemVariants, stillTransition } from '@ValenceUI/animations/reveal';
import { VALENCE_TOKENS } from '@ValenceUI/tokens';
import { setMusicPanel, useMusicPanel } from '@ValenceScreens/music/musicPanel';
import { writeMusicView } from '@ValenceScreens/music/musicView';
import { useMusicNavigation } from '@ValenceScreens/music/useMusicNavigation';
import { AlbumView } from './components/AlbumView/AlbumView';
import { ArtistView } from './components/ArtistView/ArtistView';
import { DevicesPanel } from './components/DevicesPanel/DevicesPanel';
import { LikedView } from './components/LikedView/LikedView';
import { LyricsView } from './components/LyricsView/LyricsView';
import { MusicHome } from './components/MusicHome/MusicHome';
import { MusicLibrary } from './components/MusicLibrary/MusicLibrary';
import { MusicSearchView } from './components/MusicSearchView/MusicSearchView';
import { PlaylistView } from './components/PlaylistView/PlaylistView';
import { QueuePanel } from './components/QueuePanel/QueuePanel';
import type { MusicView } from '@ValenceScreens/music/musicView';

const PANEL_TITLES = { queue: 'Queue', devices: 'Play on another device' } as const;

const PANEL_WIDTH = '20.5rem';

const OPENING = { duration: VALENCE_TOKENS.duration.slow, ease: VALENCE_TOKENS.ease.soft };

/**
 * Draws whichever page of the music section the address names.
 *
 * @param props - The view.
 * @param props.view - Which page.
 * @returns The page.
 */
const MusicViewShown = ({ view }: { view: MusicView }) => {
  if (view.kind === 'album') {
    return <AlbumView albumId={view.id} />;
  }

  if (view.kind === 'artist') {
    return <ArtistView artistId={view.id} />;
  }

  if (view.kind === 'playlist') {
    return <PlaylistView playlistId={view.id} />;
  }

  if (view.kind === 'liked') {
    return <LikedView />;
  }

  if (view.kind === 'search') {
    return <MusicSearchView query={view.query} />;
  }

  return view.kind === 'lyrics' ? <LyricsView /> : <MusicHome />;
};

MusicViewShown.displayName = 'MusicViewShown';

/**
 * The music section: the library down one side, the page being looked at in the middle, and the
 * queue or the devices down the other side when the player bar asks for them.
 *
 * Three columns that each scroll on their own, so the library stays where it was while an album
 * scrolls, and the player bar along the bottom — which lives in the shell, so music carries on
 * leaving this page — is never covered. On a narrow screen the side columns give way to the page.
 *
 * The queue and the devices open by widening from nothing, so the page beside them eases over to
 * make room rather than jumping, and the library folds away the same way where there is not room
 * for all three. Each page of the section rises in as it is opened.
 */
const MusicPage = () => {
  const { view } = useMusicNavigation();
  const panel = useMusicPanel();
  const prefersReducedMotion = useReducedMotionConfig();
  const isStill = prefersReducedMotion === true;

  return (
    <main className="px-2 pt-2 sm:px-3">
      <h1 className="sr-only">Music</h1>

      <div className="flex h-[calc(100svh-var(--nav-clearance)-var(--valence-window-bar,0px)-7.5rem)] min-h-[28rem]">
        <div
          className={cn(
            'hidden min-h-0 shrink-0 overflow-hidden lg:flex',
            'transition-[width,opacity] duration-[var(--duration-slow)] ease-[var(--ease-out)] motion-reduce:transition-none',
            panel === null
              ? 'lg:w-[17.5rem] xl:w-[19.5rem]'
              : 'lg:w-0 lg:opacity-0 xl:w-[19.5rem] xl:opacity-100',
          )}
        >
          <aside className="valence-card-shell mr-2 flex min-h-0 w-[17rem] shrink-0 xl:w-[19rem]">
            <div className="valence-card-face flex min-h-0 flex-1 flex-col">
              <MusicLibrary />
            </div>
          </aside>
        </div>

        <section aria-label="Music" className="valence-card-shell flex min-h-0 min-w-0 flex-1">
          <motion.div
            key={writeMusicView(view) ?? 'home'}
            variants={revealItemVariants(prefersReducedMotion)}
            custom={0}
            initial="hidden"
            animate="shown"
            className="valence-card-face min-h-0 flex-1 overflow-y-auto overscroll-contain"
          >
            <MusicViewShown view={view} />
          </motion.div>
        </section>

        <AnimatePresence initial={false}>
          {panel === null ? null : (
            <motion.div
              key="panel"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: PANEL_WIDTH, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={isStill ? stillTransition : OPENING}
              className="hidden min-h-0 shrink-0 justify-end overflow-hidden lg:flex"
            >
              <aside
                aria-label={PANEL_TITLES[panel]}
                className="valence-card-shell ml-2 flex min-h-0 w-[20rem] shrink-0"
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={panel}
                    variants={fadeVariants}
                    initial="hidden"
                    animate="shown"
                    exit="gone"
                    transition={stillTransition}
                    className="valence-card-face flex min-h-0 flex-1 flex-col"
                  >
                    <div className="flex items-center justify-between gap-2 px-4 pt-4 pb-2">
                      <h2 className="text-base font-bold text-text">{PANEL_TITLES[panel]}</h2>
                      <Button
                        variant="ghost"
                        size="xs"
                        isIconOnly
                        label={`Close ${PANEL_TITLES[panel].toLowerCase()}`}
                        onClick={() => {
                          setMusicPanel(null);
                        }}
                      >
                        <Icon of={Cancel01Icon} size={16} />
                      </Button>
                    </div>
                    <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-4">
                      {panel === 'queue' ? <QueuePanel /> : <DevicesPanel />}
                    </div>
                  </motion.div>
                </AnimatePresence>
              </aside>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
};

MusicPage.displayName = 'MusicPage';

export { MusicPage };
