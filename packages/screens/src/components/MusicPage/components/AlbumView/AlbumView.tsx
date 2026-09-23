import { useQuery } from '@tanstack/react-query';
import { Record as RecordIcon, Shuffle as ShuffleIcon } from '@keyline-icons/react';
import { Play as PlayFilledIcon } from '@keyline-icons/react/fill';
import { Button } from '@ValenceUI/Button';
import { CouldNotRead } from '@ValenceUI/CouldNotRead';
import { Icon } from '@ValenceUI/Icon';
import { NothingHere } from '@ValenceUI/NothingHere';
import { Skeleton } from '@ValenceUI/Skeleton';
import { formatBytes } from '@ValenceCore/functions/formatBytes';
import { formatDuration } from '@ValenceCore/functions/formatDuration';
import { albumArtworkUrl } from '@ValenceClient/music/fetchMusic';
import { musicQueries } from '@ValenceClient/query/musicQueries';
import { MusicArtwork } from '@ValenceScreens/components/MusicArtwork/MusicArtwork';
import { ExplicitMark } from '@ValenceScreens/components/ExplicitMark/ExplicitMark';
import { MusicHeader } from '@ValenceScreens/components/MusicHeader/MusicHeader';
import { TrackList } from '@ValenceScreens/components/TrackList/TrackList';
import { useLightTheMusic } from '@ValenceScreens/music/useLightTheMusic';
import { MUSIC_LANES } from '@ValenceScreens/music/musicLanes';
import { useMusicNavigation } from '@ValenceScreens/music/useMusicNavigation';
import { useMusicPlayer } from '@ValenceClient/music/useMusicPlayer';
import type { AlbumViewProps } from './AlbumView.types';

/**
 * Counts songs in words that read properly at one as well as at many.
 *
 * @param count - How many songs.
 * @returns The count and its noun.
 */
const songs = (count: number): string => (count === 1 ? '1 song' : `${count.toString()} songs`);

/**
 * An album's page: its cover large on a wash of its colour, who it is by and when, and every track
 * in the order the record plays them, with a button to play it from the top or shuffled.
 *
 * @param albumId - The album.
 */
const AlbumView = ({ albumId }: AlbumViewProps) => {
  const asked = useQuery(musicQueries.album(albumId));
  const { open } = useMusicNavigation();
  const { player } = useMusicPlayer();
  const detail = asked.data;
  const cover = detail?.album.hasArtwork === true ? albumArtworkUrl(albumId) : null;
  useLightTheMusic(cover);

  if (asked.isError) {
    return (
      <CouldNotRead
        what="this album"
        isTryingAgain={asked.isFetching}
        onTryAgain={() => {
          void asked.refetch();
        }}
      />
    );
  }

  if (detail === undefined) {
    return (
      <div className={`flex flex-col gap-4 py-8 ${MUSIC_LANES.page}`}>
        <Skeleton label="Reading the album" shape="soft" className="size-48" />
        <Skeleton className="h-12 w-2/3" />
      </div>
    );
  }

  const { album, tracks } = detail;
  const source = { kind: 'album' as const, id: album.id, name: album.title };

  return (
    <article className="flex flex-col">
      <MusicHeader
        eyebrow={album.isCompilation ? 'Compilation' : 'Album'}
        title={album.title}
        artwork={
          <MusicArtwork
            src={cover}
            label={album.title}
            travelsAs={`album-${album.id}`}
            className="w-full"
          />
        }
        details={
          <>
            <Button
              variant="link"
              size="none"
              hasTooltip={false}
              className="font-semibold text-text"
              onClick={() => {
                open({ kind: 'artist', id: album.artist.id });
              }}
            >
              {album.artist.name}
            </Button>
            {album.year === null ? null : <span>· {album.year.toString()}</span>}
            <span>· {songs(album.trackCount)}</span>
            <span>· {formatDuration(album.durationSeconds)}</span>
            {album.sizeBytes <= 0 ? null : <span>· {formatBytes(album.sizeBytes)}</span>}
            {album.isExplicit ? <ExplicitMark className="ml-1" /> : null}
          </>
        }
        actions={
          <>
            <Button
              variant="confirm"
              size="lg"
              isIconOnly
              label={`Play ${album.title}`}
              className="size-14"
              disabled={tracks.length === 0}
              onClick={() => {
                player.play(tracks, 0, { source });
              }}
            >
              <Icon of={PlayFilledIcon} size={24} />
            </Button>
            <Button
              variant="ghost"
              size="md"
              isIconOnly
              label={`Shuffle ${album.title}`}
              disabled={tracks.length === 0}
              onClick={() => {
                player.play(tracks, Math.floor(Math.random() * tracks.length), {
                  source,
                  isShuffled: true,
                });
              }}
            >
              <Icon of={ShuffleIcon} size={22} />
            </Button>
          </>
        }
      />

      <div className={`pb-8 ${MUSIC_LANES.tracks}`}>
        {tracks.length === 0 ? (
          <NothingHere of={RecordIcon} title="Nothing on this album you can hear" />
        ) : (
          <TrackList
            label={album.title}
            tracks={tracks}
            numbering="track"
            showsAlbum={false}
            onPlay={(index) => {
              player.play(tracks, index, { source });
            }}
          />
        )}

        {album.genres.length === 0 ? null : (
          <p className="px-3 pt-6 text-xs text-text-muted">{album.genres.join(' · ')}</p>
        )}
      </div>
    </article>
  );
};

AlbumView.displayName = 'AlbumView';

export { AlbumView };
