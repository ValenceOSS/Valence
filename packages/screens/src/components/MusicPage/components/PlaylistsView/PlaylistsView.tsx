import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus as PlusIcon } from '@keyline-icons/react';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import { Skeleton } from '@ValenceUI/Skeleton';
import { musicQueries } from '@ValenceClient/query/musicQueries';
import { PlaylistDialog } from '@ValenceScreens/components/PlaylistDialog/PlaylistDialog';
import { PlaylistShelf } from '@ValenceScreens/components/PlaylistShelf/PlaylistShelf';
import { MUSIC_LANES } from '@ValenceScreens/music/musicLanes';
import { useLightTheMusic } from '@ValenceScreens/music/useLightTheMusic';
import { useLikedSongsTile } from '@ValenceScreens/music/useLikedSongsTile';
import { useMusicNavigation } from '@ValenceScreens/music/useMusicNavigation';

/**
 * Somebody's playlists, with their liked songs at the front and a way to start a new one, then
 * whatever the rest of the household has shared with them.
 */
const PlaylistsView = () => {
  const [isMaking, setIsMaking] = useState(false);
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
          <Skeleton label="Reading your playlists" className="h-64 w-full" />
        </div>
      ) : (
        <>
          <PlaylistShelf
            heading="Playlists"
            layout="grid"
            playlists={mine}
            leading={liked}
            action={
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setIsMaking(true);
                }}
              >
                <Icon of={PlusIcon} size={16} />
                New playlist
              </Button>
            }
          />

          <PlaylistShelf heading="Shared with you" layout="grid" playlists={shared} />
        </>
      )}

      <PlaylistDialog
        isOpen={isMaking}
        onClose={() => {
          setIsMaking(false);
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
