import { Menu as MenuIcon, X as XIcon } from '@keyline-icons/react';
import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotionConfig } from 'motion/react';
import { Button } from '@ValenceUI/Button';
import { Dialog } from '@ValenceUI/Dialog';
import { DialogContent } from '@ValenceUI/DialogContent';
import { DialogTitle } from '@ValenceUI/DialogTitle';
import { Icon } from '@ValenceUI/Icon';
import { cn } from '@ValenceUI/cn';
import {
  fadeVariants,
  revealTransition,
  revealVariants,
  stillTransition,
} from '@ValenceUI/animations/reveal';
import { VALENCE_TOKENS } from '@ValenceUI/tokens';
import { setMusicPanel, useMusicPanel } from '@ValenceScreens/music/musicPanel';
import { writeMusicView } from '@ValenceClient/music/musicView';
import { useRoomForThePanels } from '@ValenceScreens/music/useRoomForThePanels';
import { useMusicNavigation } from '@ValenceScreens/music/useMusicNavigation';
import { AlbumView } from './components/AlbumView/AlbumView';
import { AlbumsView } from './components/AlbumsView/AlbumsView';
import { ArtistView } from './components/ArtistView/ArtistView';
import { ArtistsView } from './components/ArtistsView/ArtistsView';
import { DevicesPanel } from './components/DevicesPanel/DevicesPanel';
import { LikedView } from './components/LikedView/LikedView';
import { ListeningPartyPanel } from './components/ListeningPartyPanel/ListeningPartyPanel';
import { LyricsView } from './components/LyricsView/LyricsView';
import { MusicHome } from './components/MusicHome/MusicHome';
import { MusicLibrary } from './components/MusicLibrary/MusicLibrary';
import { MusicVideoDialog } from './components/MusicVideoDialog/MusicVideoDialog';
import { MusicWash } from './components/MusicWash/MusicWash';
import { MusicSearchView } from './components/MusicSearchView/MusicSearchView';
import { PlaylistView } from './components/PlaylistView/PlaylistView';
import { PlaylistsView } from './components/PlaylistsView/PlaylistsView';
import { QueuePanel } from './components/QueuePanel/QueuePanel';
import type { MusicView } from '@ValenceClient/music/musicView';

const PANEL_TITLES = {
  queue: 'Queue',
  devices: 'Play on another device',
  party: 'Listening party',
} as const;

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

  if (view.kind === 'albums') {
    return <AlbumsView />;
  }

  if (view.kind === 'artists') {
    return <ArtistsView />;
  }

  if (view.kind === 'playlists') {
    return <PlaylistsView />;
  }

  if (view.kind === 'search') {
    return <MusicSearchView query={view.query} />;
  }

  return view.kind === 'lyrics' ? <LyricsView /> : <MusicHome />;
};

MusicViewShown.displayName = 'MusicViewShown';

/**
 * The music section: the library down the left, the page being looked at in the middle, and the
 * queue, the devices or the listening party down the right when the player bar asks for them.
 *
 * Three cards that each scroll on their own, so the library stays where it was while an album
 * scrolls. The middle one glows in the colours of whatever it shows. The right-hand card widens from nothing so the page eases over to
 * make room rather than jumping, and the library folds away the same way where there is not room
 * for all three. The player bar along the bottom lives in the shell, so music carries on as
 * somebody leaves.
 */
const MusicPage = () => {
  const { view } = useMusicNavigation();
  const panel = useMusicPanel();
  const prefersReducedMotion = useReducedMotionConfig();
  const isStill = prefersReducedMotion === true;
  const isWide = useRoomForThePanels();
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const viewKey = writeMusicView(view) ?? 'home';

  useEffect(() => {
    setIsLibraryOpen(false);
  }, [viewKey]);

  return (
    <main className="px-2 pt-2 sm:px-3 sm:pt-3">
      <h1 className="sr-only">Music</h1>

      <div className="flex flex-col h-[calc(100svh-var(--nav-clearance)-var(--valence-window-bar,0px)-var(--music-bar-room,0px)-1rem)] min-h-[28rem] sm:h-[calc(100svh-var(--nav-clearance)-var(--valence-window-bar,0px)-var(--music-bar-room,0px)-1.5rem)]">
        {isWide ? null : (
          <div className="flex shrink-0 justify-start pb-2">
            <Button
              variant="glossy"
              size="sm"
              onClick={() => {
                setIsLibraryOpen(true);
              }}
            >
              Your library
              <Icon of={MenuIcon} size={16} />
            </Button>
          </div>
        )}

        <div className="flex min-h-0 flex-1">
          {isWide ? (
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
                <div className="valence-card-face valence-card-face--raised flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
                  <MusicLibrary />
                </div>
              </aside>
            </div>
          ) : null}

          <section aria-label="Music" className="valence-card-shell flex min-h-0 min-w-0 flex-1">
            <div className="valence-card-face valence-card-face--raised relative min-h-0 flex-1 overflow-y-auto overscroll-contain [container-type:size] [--music-lane:1.25rem] sm:[--music-lane:2rem]">
              <MusicWash />

              <div className={cn('relative flex flex-col', view.kind === 'lyrics' ? '' : 'pt-2')}>
                <motion.div
                  key={writeMusicView(view) ?? 'home'}
                  variants={revealVariants(prefersReducedMotion)}
                  initial="hidden"
                  animate="shown"
                  transition={revealTransition(prefersReducedMotion, 'heavy')}
                  className="min-w-0"
                >
                  <MusicViewShown view={view} />
                </motion.div>
              </div>
            </div>
          </section>

          {isWide ? (
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
                        className="valence-card-face valence-card-face--raised flex min-h-0 min-w-0 flex-1 flex-col"
                      >
                        <div className="flex items-center justify-between gap-2 px-4 pt-4 pb-2">
                          <h2 className="text-base font-semibold tracking-tight text-text">
                            {PANEL_TITLES[panel]}
                          </h2>
                          <Button
                            variant="ghost"
                            size="xs"
                            isIconOnly
                            label={`Close ${PANEL_TITLES[panel].toLowerCase()}`}
                            onClick={() => {
                              setMusicPanel(null);
                            }}
                          >
                            <Icon of={XIcon} size={16} />
                          </Button>
                        </div>
                        <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-4">
                          {panel === 'queue' ? (
                            <QueuePanel />
                          ) : panel === 'devices' ? (
                            <DevicesPanel />
                          ) : (
                            <ListeningPartyPanel />
                          )}
                        </div>
                      </motion.div>
                    </AnimatePresence>
                  </aside>
                </motion.div>
              )}
            </AnimatePresence>
          ) : null}
        </div>
      </div>

      <Dialog
        label="Your library"
        isOpen={!isWide && isLibraryOpen}
        onClose={() => {
          setIsLibraryOpen(false);
        }}
        size="drawer"
      >
        <DialogContent className="p-0">
          <MusicLibrary />
        </DialogContent>
      </Dialog>

      <Dialog
        label={panel === null ? 'Music' : PANEL_TITLES[panel]}
        isOpen={!isWide && panel !== null}
        onClose={() => {
          setMusicPanel(null);
        }}
        size="drawer"
      >
        {panel === null ? null : (
          <>
            <DialogTitle title={PANEL_TITLES[panel]} />

            <DialogContent>
              {panel === 'queue' ? (
                <QueuePanel />
              ) : panel === 'devices' ? (
                <DevicesPanel />
              ) : (
                <ListeningPartyPanel />
              )}
            </DialogContent>
          </>
        )}
      </Dialog>

      <MusicVideoDialog />
    </main>
  );
};

MusicPage.displayName = 'MusicPage';

export { MusicPage };
