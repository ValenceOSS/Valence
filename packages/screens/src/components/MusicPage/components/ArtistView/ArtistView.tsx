import { useState } from 'react';
import { PluginPanels } from '@ValenceScreens/components/PluginPanels/PluginPanels';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Check as CheckIcon, Plus as PlusIcon, User as UserIcon } from '@keyline-icons/react';
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
import { artistWhileReading } from '@ValenceClient/music/artistWhileReading';
import { musicQueries } from '@ValenceClient/query/musicQueries';
import { MusicArtwork } from '@ValenceScreens/components/MusicArtwork/MusicArtwork';
import { MusicHeader } from '@ValenceScreens/components/MusicHeader/MusicHeader';
import { AlbumShelf } from '@ValenceScreens/components/AlbumShelf/AlbumShelf';
import { TrackList } from '@ValenceScreens/components/TrackList/TrackList';
import { useLightTheMusic } from '@ValenceScreens/music/useLightTheMusic';
import { MUSIC_LANES } from '@ValenceScreens/music/musicLanes';
import { useMusicPlayer } from '@ValenceClient/music/useMusicPlayer';
import { PlayAndShuffle } from '@ValenceScreens/components/MusicPage/components/PlayAndShuffle/PlayAndShuffle';
import { ArtistStory } from '@ValenceScreens/components/MusicPage/components/ArtistView/components/ArtistStory/ArtistStory';
import type { ArtistViewProps } from './ArtistView.types';
import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';

/**
 * An artist's page: their picture, a button to follow them, the songs of theirs this household
 * likes most, every album of theirs, and the ones they turn up on as a guest — which is what
 * crediting each track's artists separately is for.
 *
 * @param artistId - The artist.
 */
const ArtistView = ({ artistId }: ArtistViewProps) => {
  const cache = useQueryClient();
  const asked = useQuery({
    ...musicQueries.artist(artistId),
    placeholderData: () => artistWhileReading(cache, artistId),
  });
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
        said={say('screens.musicPage.artistView.thisArtistCouldNotBeRead')}
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
        <Skeleton
          label={say('screens.musicPage.artistView.readingTheArtist')}
          shape="round"
          className="size-48"
        />
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
        eyebrow={say('common.artist')}
        title={artist.name}
        backdrop={picture}
        isBackdropSharp={artist.hasImage}
        artwork={
          artist.hasImage ? undefined : (
            <MusicArtwork src={picture} label={artist.name} shape="round" className="w-full" />
          )
        }
        details={
          <span>
            {sayCount('common.count.albums', artist.albumCount)} ·{' '}
            {sayCount('common.count.songs', artist.trackCount)}
          </span>
        }
        actions={
          <>
            <PlayAndShuffle
              tracks={popular}
              source={source}
              playLabel={say('common.play')}
              shuffleLabel={say('common.shuffle')}
            />
            <Button
              variant="ghost"
              size="none"
              label={isFollowed ? say('common.following') : say('common.follow')}
              isActive={isFollowed}
              onClick={() => {
                const next = !isFollowed;

                setFollowing(next);

                void setArtistFollowed(artist.id, next).then((agreed) => {
                  if (!agreed) {
                    setFollowing(!next);
                  }

                  void cache.invalidateQueries({ queryKey: musicQueries.artists(true).queryKey });
                  void cache.invalidateQueries({
                    queryKey: musicQueries.artist(artist.id).queryKey,
                  });
                });
              }}
            >
              <Icon of={isFollowed ? CheckIcon : PlusIcon} size={20} />
            </Button>
          </>
        }
      />

      <div className="flex flex-col gap-12 pb-10">
        {asked.isPlaceholderData ? (
          <div className={`flex flex-col gap-2 ${MUSIC_LANES.tracks}`}>
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        ) : popular.length === 0 ? (
          <NothingHere
            of={UserIcon}
            title={say('screens.musicPage.artistView.nothingOfTheirsYouCanHear')}
          />
        ) : (
          <section
            aria-label={say('common.songs2')}
            className={`flex flex-col gap-3 ${MUSIC_LANES.tracks}`}
          >
            <h2 className="px-3 text-lg font-semibold tracking-tight text-text">
              {say('common.songs2')}
            </h2>
            <TrackList
              label={say('screens.musicPage.artistView.songsByName', { name: artist.name })}
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
          heading={say('common.albums')}
          albums={albums}
          detailOf={(album) =>
            [
              album.year?.toString(),
              album.isCompilation ? say('common.compilation') : say('common.album'),
            ]
              .filter((part) => part !== undefined)
              .join(' · ')
          }
        />

        <AlbumShelf heading={say('common.appearsOn')} albums={appearsOn} />

        <ArtistStory artistId={artist.id} name={artist.name} />

        <PluginPanels on="artist" subjectId={artist.id} />
      </div>
    </article>
  );
};

ArtistView.displayName = 'ArtistView';

export { ArtistView };
