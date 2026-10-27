import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ListFilter as ListFilterIcon, Plus as PlusIcon } from '@keyline-icons/react';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import { Skeleton } from '@ValenceUI/Skeleton';
import { useServerHas } from '@ValenceClient/about/useServerHas';
import { musicQueries } from '@ValenceClient/query/musicQueries';
import { PlaylistDialog } from '@ValenceScreens/components/PlaylistDialog/PlaylistDialog';
import { PlaylistShelf } from '@ValenceScreens/components/PlaylistShelf/PlaylistShelf';
import { MUSIC_LANES } from '@ValenceScreens/music/musicLanes';
import { useLightTheMusic } from '@ValenceScreens/music/useLightTheMusic';
import { useLikedSongsTile } from '@ValenceScreens/music/useLikedSongsTile';
import { useMusicNavigation } from '@ValenceScreens/music/useMusicNavigation';
import { say } from '@ValenceI18n/say';

/**
 * Somebody's playlists, with their liked songs at the front and a way to start a new one — by hand,
 * or smart, filled from rules, where the server can — then whatever the rest of the household has
 * shared with them.
 */
const PlaylistsView = () => {
  const [making, setMaking] = useState<'byHand' | 'smart' | null>(null);
  const canMakeSmart = useServerHas('library.smartLists') === true;
  const playlists = useQuery(musicQueries.playlists());
  const liked = useLikedSongsTile();
  const { open } = useMusicNavigation();
  const mine = (playlists.data ?? []).filter((playlist) => playlist.isMine);
  const shared = (playlists.data ?? []).filter((playlist) => !playlist.isMine);

  useLightTheMusic(null);

  return (
    <div className="flex flex-col gap-12 pt-6 pb-12">
      {playlists.isPending ? (
        <div className={MUSIC_LANES.page}>
          <Skeleton
            label={say('screens.musicPage.playlistsView.readingYourPlaylists')}
            className="h-64 w-full"
          />
        </div>
      ) : (
        <>
          <PlaylistShelf
            heading={say('common.playlists')}
            layout="grid"
            playlists={mine}
            leading={liked}
            action={
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setMaking('byHand');
                  }}
                >
                  <Icon of={PlusIcon} size={16} />
                  {say('common.newPlaylist')}
                </Button>

                {canMakeSmart ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setMaking('smart');
                    }}
                  >
                    <Icon of={ListFilterIcon} size={16} />
                    {say('common.newSmartPlaylist')}
                  </Button>
                ) : null}
              </div>
            }
          />

          <PlaylistShelf heading={say('common.sharedWithYou')} layout="grid" playlists={shared} />
        </>
      )}

      <PlaylistDialog
        isOpen={making !== null}
        isSmart={making === 'smart'}
        onClose={() => {
          setMaking(null);
        }}
        onSaved={(playlistId) => {
          open({ kind: 'playlist', id: playlistId });
        }}
      />
    </div>
  );
};

PlaylistsView.displayName = 'PlaylistsView';

export { PlaylistsView };
