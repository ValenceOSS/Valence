import { useQuery } from '@tanstack/react-query';
import { Heart as HeartIcon, Shuffle as ShuffleIcon } from '@keyline-icons/react';
import { Heart as HeartFilledIcon, Play as PlayFilledIcon } from '@keyline-icons/react/fill';
import { Button } from '@ValenceUI/Button';
import { CouldNotRead } from '@ValenceUI/CouldNotRead';
import { Icon } from '@ValenceUI/Icon';
import { NothingHere } from '@ValenceUI/NothingHere';
import { Skeleton } from '@ValenceUI/Skeleton';
import { formatDuration } from '@ValenceCore/functions/formatDuration';
import { musicQueries } from '@ValenceClient/query/musicQueries';
import { useLightTheMusic } from '@ValenceScreens/music/useLightTheMusic';
import { MUSIC_LANES } from '@ValenceScreens/music/musicLanes';
import { PlaylistCover } from '@ValenceScreens/components/PlaylistCover/PlaylistCover';
import { coverAlbumsOf } from '@ValenceClient/music/coverAlbumsOf';
import { MusicHeader } from '@ValenceScreens/components/MusicHeader/MusicHeader';
import { TrackList } from '@ValenceScreens/components/TrackList/TrackList';
import { useMusicPlayer } from '@ValenceClient/music/useMusicPlayer';

const SOURCE = { kind: 'liked', id: null, name: say('common.likedSongs2') } as const;
import { albumArtworkUrl } from '@ValenceClient/music/fetchMusic';
import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';

/**
 * Every song this profile has liked, newest first — a playlist nobody has to make, kept by pressing
 * the heart beside a song anywhere.
 */
const LikedView = () => {
  const asked = useQuery(musicQueries.liked());
  const { player } = useMusicPlayer();
  const tracks = asked.data ?? [];
  const covers = coverAlbumsOf(tracks);

  useLightTheMusic(covers[0] === undefined ? null : albumArtworkUrl(covers[0]));
  const total = tracks.reduce((sum, track) => sum + track.durationSeconds, 0);

  if (asked.isError) {
    return (
      <CouldNotRead
        said={say('screens.musicPage.likedView.yourLikedSongsCouldNotBeRead')}
        isTryingAgain={asked.isFetching}
        onTryAgain={() => {
          void asked.refetch();
        }}
      />
    );
  }

  return (
    <article className="flex flex-col">
      <MusicHeader
        eyebrow={say('common.playlist')}
        title={say('common.likedSongs2')}
        artwork={
          <PlaylistCover
            name={say('common.likedSongs2')}
            albumIds={covers}
            standIn={HeartFilledIcon}
            iconSize={72}
            className="w-full"
          />
        }
        details={
          <span>
            {sayCount('common.count.songs', tracks.length)} · {formatDuration(total)}
          </span>
        }
        actions={
          <>
            <Button
              variant="confirm"
              size="lg"
              isIconOnly
              label={say('screens.musicPage.likedView.playLikedSongs')}
              className="size-14"
              disabled={tracks.length === 0}
              onClick={() => {
                player.play(tracks, 0, { source: SOURCE });
              }}
            >
              <Icon of={PlayFilledIcon} size={24} />
            </Button>
            <Button
              variant="ghost"
              size="md"
              isIconOnly
              label={say('screens.musicPage.likedView.shuffleLikedSongs')}
              disabled={tracks.length === 0}
              onClick={() => {
                player.play(tracks, Math.floor(Math.random() * tracks.length), {
                  source: SOURCE,
                  isShuffled: true,
                });
              }}
            >
              <Icon of={ShuffleIcon} size={22} />
            </Button>
          </>
        }
      />

      <div className={`pb-10 ${MUSIC_LANES.tracks}`}>
        {asked.isPending ? (
          <Skeleton
            label={say('screens.musicPage.likedView.readingYourLikedSongs')}
            className="h-40 w-full"
          />
        ) : tracks.length === 0 ? (
          <NothingHere
            of={HeartIcon}
            title={say('screens.musicPage.likedView.songsYouLikeWillBeHere')}
            detail={say('screens.musicPage.likedView.pressTheHeartBesideAnySong')}
          />
        ) : (
          <TrackList
            label={say('common.likedSongs2')}
            tracks={tracks}
            showsArtwork
            onPlay={(index) => {
              player.play(tracks, index, { source: SOURCE });
            }}
          />
        )}
      </div>
    </article>
  );
};

LikedView.displayName = 'LikedView';

export { LikedView };
