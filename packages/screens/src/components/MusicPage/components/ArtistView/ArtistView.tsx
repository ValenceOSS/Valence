import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { PlayIcon, User03Icon } from '@hugeicons/core-free-icons';
import { Button } from '@ValenceUI/Button';
import { CouldNotRead } from '@ValenceUI/CouldNotRead';
import { Icon } from '@ValenceUI/Icon';
import { NothingHere } from '@ValenceUI/NothingHere';
import { Skeleton } from '@ValenceUI/Skeleton';
import {
  albumArtworkUrl,
  artistImageUrl,
  setArtistFollowed,
} from '@ValenceClient/music/fetchMusic';
import { musicQueries } from '@ValenceClient/query/musicQueries';
import { MusicArtwork } from '@ValenceScreens/components/MusicArtwork/MusicArtwork';
import { MusicHeader } from '@ValenceScreens/components/MusicHeader/MusicHeader';
import { AlbumShelf } from '@ValenceScreens/components/AlbumShelf/AlbumShelf';
import { TrackList } from '@ValenceScreens/components/TrackList/TrackList';
import { useLightTheMusic } from '@ValenceScreens/music/useLightTheMusic';
import { MUSIC_LANES } from '@ValenceScreens/music/musicLanes';
import { useMusicPlayer } from '@ValenceScreens/music/useMusicPlayer';
import type { ArtistViewProps } from './ArtistView.types';

/**
 * An artist's page: their picture, a button to follow them, the songs of theirs this household
 * likes most, every album of theirs, and the ones they turn up on as a guest — which is what
 * crediting each track's artists separately is for.
 *
 * @param artistId - The artist.
 */
const ArtistView = ({ artistId }: ArtistViewProps) => {
  const cache = useQueryClient();
  const asked = useQuery(musicQueries.artist(artistId));
  const { player } = useMusicPlayer();
  const [following, setFollowing] = useState<boolean | null>(null);
  const detail = asked.data;
  const picture =
    detail === undefined
      ? null
      : detail.artist.hasImage
        ? artistImageUrl(artistId)
        : detail.artist.imageAlbumId === null
          ? null
          : albumArtworkUrl(detail.artist.imageAlbumId);
  useLightTheMusic(picture);

  if (asked.isError) {
    return (
      <CouldNotRead
        what="this artist"
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
        <Skeleton label="Reading the artist" className="size-48 rounded-full" />
        <Skeleton className="h-12 w-1/2" />
      </div>
    );
  }

  const { artist, albums, appearsOn, popular } = detail;
  const isFollowed = following ?? artist.isFavourite;
  const source = { kind: 'artist' as const, id: artist.id, name: artist.name };

  return (
    <article className="flex flex-col">
      <MusicHeader
        eyebrow="Artist"
        title={artist.name}
        artwork={
          <MusicArtwork
            src={picture}
            label={artist.name}
            shape="round"
            travelsAs={`artist-${artist.id}`}
            className="w-full"
          />
        }
        details={
          <span>
            {artist.albumCount === 1 ? '1 album' : `${artist.albumCount.toString()} albums`} ·{' '}
            {artist.trackCount === 1 ? '1 song' : `${artist.trackCount.toString()} songs`}
          </span>
        }
        actions={
          <>
            <Button
              variant="glossy"
              size="lg"
              isIconOnly
              label={`Play ${artist.name}`}
              className="size-14"
              disabled={popular.length === 0}
              onClick={() => {
                player.play(popular, 0, { source });
              }}
            >
              <Icon of={PlayIcon} size={24} isActive />
            </Button>
            <Button
              variant={isFollowed ? 'secondary' : 'ghost'}
              size="md"
              isActive={isFollowed}
              onClick={() => {
                const next = !isFollowed;

                setFollowing(next);

                void setArtistFollowed(artist.id, next).then((agreed) => {
                  if (!agreed) {
                    setFollowing(!next);
                  }

                  void cache.invalidateQueries({ queryKey: musicQueries.artists(true).queryKey });
                });
              }}
            >
              {isFollowed ? 'Following' : 'Follow'}
            </Button>
          </>
        }
      />

      <div className="flex flex-col gap-12 pb-10">
        {popular.length === 0 ? (
          <NothingHere of={User03Icon} title="Nothing of theirs you can hear" />
        ) : (
          <section aria-label="Songs" className={`flex flex-col gap-3 ${MUSIC_LANES.tracks}`}>
            <h2 className="px-3 text-lg font-semibold tracking-tight text-text">Songs</h2>
            <TrackList
              label={`Songs by ${artist.name}`}
              tracks={popular}
              showsArtwork
              showsAlbum={false}
              onPlay={(index) => {
                player.play(popular, index, { source });
              }}
            />
          </section>
        )}

        <AlbumShelf
          heading="Albums"
          albums={albums}
          detailOf={(album) =>
            [album.year?.toString(), album.isCompilation ? 'Compilation' : 'Album']
              .filter((part) => part !== undefined)
              .join(' · ')
          }
        />

        <AlbumShelf heading="Appears on" albums={appearsOn} />
      </div>
    </article>
  );
};

ArtistView.displayName = 'ArtistView';

export { ArtistView };
