import { Cancel01Icon } from '@hugeicons/core-free-icons';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import { cn } from '@ValenceUI/cn';
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
 */
const MusicPage = () => {
  const { view } = useMusicNavigation();
  const panel = useMusicPanel();

  return (
    <main className="px-2 pt-2 sm:px-3">
      <h1 className="sr-only">Music</h1>

      <div
        className={cn(
          'grid h-[calc(100svh-var(--nav-clearance)-var(--valence-window-bar,0px)-7.5rem)] min-h-[28rem] gap-2',
          panel === null
            ? 'lg:grid-cols-[17rem_minmax(0,1fr)] xl:grid-cols-[19rem_minmax(0,1fr)]'
            : 'lg:grid-cols-[minmax(0,1fr)_20rem] xl:grid-cols-[19rem_minmax(0,1fr)_20rem]',
        )}
      >
        <aside
          className={cn(
            'valence-card-shell min-h-0',
            panel === null ? 'hidden lg:flex' : 'hidden xl:flex',
          )}
        >
          <div className="valence-card-face flex min-h-0 flex-1 flex-col">
            <MusicLibrary />
          </div>
        </aside>

        <section aria-label="Music" className="valence-card-shell flex min-h-0">
          <div
            key={writeMusicView(view) ?? 'home'}
            className="valence-card-face min-h-0 flex-1 overflow-y-auto overscroll-contain"
          >
            <MusicViewShown view={view} />
          </div>
        </section>

        {panel === null ? null : (
          <aside
            aria-label={PANEL_TITLES[panel]}
            className="valence-card-shell hidden min-h-0 lg:flex"
          >
            <div className="valence-card-face flex min-h-0 flex-1 flex-col">
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
            </div>
          </aside>
        )}
      </div>
    </main>
  );
};

MusicPage.displayName = 'MusicPage';

export { MusicPage };
