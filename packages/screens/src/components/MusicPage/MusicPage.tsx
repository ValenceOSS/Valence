import { Menu as MenuIcon } from '@keyline-icons/react';
import { useEffect, useState } from 'react';
import { motion, useReducedMotionConfig } from 'motion/react';
import { Button } from '@ValenceUI/Button';
import { Dialog } from '@ValenceUI/Dialog';
import { DialogContent } from '@ValenceUI/DialogContent';
import { DialogTitle } from '@ValenceUI/DialogTitle';
import { Icon } from '@ValenceUI/Icon';
import { cn } from '@ValenceUI/cn';
import { revealTransition, revealVariants } from '@ValenceUI/animations/reveal';
import { useMatchesMedia } from '@ValenceUI/useMatchesMedia';
import { setMusicPanel, useMusicPanel } from '@ValenceScreens/music/musicPanel';
import { readMusicPanelCollapsed } from '@ValenceScreens/music/musicPanelCollapsed';
import { writeMusicView } from '@ValenceClient/music/musicView';
import { useRoomForThePanels } from '@ValenceScreens/music/useRoomForThePanels';
import { useMusicNavigation } from '@ValenceScreens/music/useMusicNavigation';
import { useReadAheadPlayingArtists } from '@ValenceScreens/music/useReadAheadPlayingArtists';
import { AlbumView } from './components/AlbumView/AlbumView';
import { AlbumsView } from './components/AlbumsView/AlbumsView';
import { ArtistView } from './components/ArtistView/ArtistView';
import { ArtistsView } from './components/ArtistsView/ArtistsView';
import { DevicesPanel } from './components/DevicesPanel/DevicesPanel';
import { LikedView } from './components/LikedView/LikedView';
import { ListeningPartyPanel } from './components/ListeningPartyPanel/ListeningPartyPanel';
import { MixView } from './components/MixView/MixView';
import { LyricsView } from './components/LyricsView/LyricsView';
import { LyricsPanel } from './components/LyricsPanel/LyricsPanel';
import { MusicHome } from './components/MusicHome/MusicHome';
import { MusicLibrary } from './components/MusicLibrary/MusicLibrary';
import { MusicSidePanel } from './components/MusicSidePanel/MusicSidePanel';
import { MusicVideoDialog } from './components/MusicVideoDialog/MusicVideoDialog';
import { MusicWash } from './components/MusicWash/MusicWash';
import { MusicSearchView } from './components/MusicSearchView/MusicSearchView';
import { PlaylistView } from './components/PlaylistView/PlaylistView';
import { PlaylistsView } from './components/PlaylistsView/PlaylistsView';
import { QueuePanel } from './components/QueuePanel/QueuePanel';
import type { MusicView } from '@ValenceClient/music/musicView';
import { say } from '@ValenceI18n/say';

const ALL_THREE_FIT_FROM = '(min-width: 80rem)';

const DEFAULT_PANEL = 'lyrics';

const PANEL_TITLES = {
  queue: say('common.queue'),
  lyrics: say('common.lyrics'),
  devices: say('common.playOnAnotherDevice'),
  party: say('common.listeningParty'),
} as const;

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
    return (
      <PlaylistView playlistId={view.id} isRequestingMissing={view.isRequestingMissing === true} />
    );
  }

  if (view.kind === 'liked') {
    return <LikedView />;
  }

  if (view.kind === 'mix') {
    return <MixView mixId={view.id} />;
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
 * The music section: the sidebar down the left from the very top of the window, with the mark on
 * the top bar standing in it, the page running between it and the edge, lit in the colours of whatever it shows, and the column for the words, the queue,
 * the devices and the party down the right, open from the start wherever all three fit and folding
 * to a strip of its tabs when closed. Where they do not fit the sidebar gives way to the column, and on a small screen both become drawers.
 */
const MusicPage = () => {
  const { view } = useMusicNavigation();
  const panel = useMusicPanel();

  useReadAheadPlayingArtists();

  const prefersReducedMotion = useReducedMotionConfig();
  const isWide = useRoomForThePanels();
  const hasRoomForAll = useMatchesMedia(ALL_THREE_FIT_FROM);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const viewKey = writeMusicView(view) ?? 'home';

  useEffect(() => {
    setIsLibraryOpen(false);
  }, [viewKey]);

  useEffect(() => {
    if (hasRoomForAll && panel === null && !readMusicPanelCollapsed()) {
      setMusicPanel(DEFAULT_PANEL);
    }
  }, [hasRoomForAll, panel]);

  return (
    <main>
      <h1 className="sr-only">{say('common.music')}</h1>

      <div className="flex h-[calc(100svh-var(--nav-clearance)-var(--music-bar-room,0px))] min-h-[28rem] flex-col lg:flex-row">
        {isWide ? (
          <aside
            className={cn(
              'hidden min-h-0 w-[18.5rem] shrink-0 bg-surface-raised',
              'lg:mt-[calc(var(--nav-clearance)*-1)] lg:h-[calc(100%+var(--nav-clearance))] lg:pt-[var(--nav-clearance)]',
              panel === null ? 'lg:block' : 'xl:block',
            )}
          >
            <MusicLibrary />
          </aside>
        ) : (
          <div className="flex shrink-0 justify-start px-3 py-2">
            <Button
              variant="glossy"
              size="sm"
              onClick={() => {
                setIsLibraryOpen(true);
              }}
            >
              {say('common.yourLibrary')}
              <Icon of={MenuIcon} size={16} />
            </Button>
          </div>
        )}

        <section
          aria-label={say('common.music')}
          className="relative min-h-0 min-w-0 flex-1 overflow-hidden [container-type:size] [--music-lane:1.25rem] sm:[--music-lane:2.5rem] lg:rounded-t-[1.25rem]"
        >
          <div className="h-full overflow-y-auto overscroll-contain pb-8">
            <MusicWash />

            <div className="relative flex flex-col">
              <motion.div
                key={viewKey}
                variants={revealVariants(prefersReducedMotion)}
                initial="hidden"
                animate="shown"
                transition={revealTransition(prefersReducedMotion)}
                className="min-w-0"
              >
                <MusicViewShown view={view} />
              </motion.div>
            </div>
          </div>
        </section>

        {isWide ? <MusicSidePanel panel={panel} /> : null}
      </div>

      <Dialog
        label={say('common.yourLibrary')}
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
        label={panel === null ? say('common.music') : PANEL_TITLES[panel]}
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
              ) : panel === 'lyrics' ? (
                <LyricsPanel />
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
