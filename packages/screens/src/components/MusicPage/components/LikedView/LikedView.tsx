import { useQuery } from '@tanstack/react-query';
import { Heart as HeartIcon, Shuffle as ShuffleIcon } from '@keyline-icons/react';
import { Play as PlayFilledIcon } from '@keyline-icons/react/fill';
import { Button } from '@ValenceUI/Button';
import { CouldNotRead } from '@ValenceUI/CouldNotRead';
import { Icon } from '@ValenceUI/Icon';
import { NothingHere } from '@ValenceUI/NothingHere';
import { Skeleton } from '@ValenceUI/Skeleton';
import { formatDuration } from '@ValenceCore/functions/formatDuration';
import { musicQueries } from '@ValenceClient/query/musicQueries';
import { useLightTheMusic } from '@ValenceScreens/music/useLightTheMusic';
import { MUSIC_LANES } from '@ValenceScreens/music/musicLanes';
import { LikedCover } from '@ValenceScreens/components/LikedCover/LikedCover';
import { MusicHeader } from '@ValenceScreens/components/MusicHeader/MusicHeader';
import { TrackList } from '@ValenceScreens/components/TrackList/TrackList';
import { useMusicPlayer } from '@ValenceClient/music/useMusicPlayer';
import { say } from '@ValenceI18n/say';

/**
 * Every song this profile has liked, newest first — a playlist nobody has to make, kept by pressing
 * the heart beside a song anywhere.
 */
const LikedView = () => {
  const asked = useQuery(musicQueries.liked());

  useLightTheMusic(null);
  const { player } = useMusicPlayer();
  const source = { kind: 'liked', id: null, name: say('screens.likedView.title') } as const;
  const tracks = asked.data ?? [];
  const total = tracks.reduce((sum, track) => sum + track.durationSeconds, 0);

  if (asked.isError) {
    return (
      <CouldNotRead
        what={say('screens.likedView.couldNotReadWhat')}
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
        eyebrow={say('screens.likedView.playlist')}
        title={say('screens.likedView.title')}
        artwork={<LikedCover iconSize={72} />}
        details={
          <span>
            {tracks.length === 1 ? '1 song' : `${tracks.length.toString()} songs`} ·{' '}
            {formatDuration(total)}
          </span>
        }
        actions={
          <>
            <Button
              variant="confirm"
              size="lg"
              isIconOnly
              label={say('screens.likedView.play')}
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
              label={say('screens.likedView.shuffle')}
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

      <div className={`pb-10 ${MUSIC_LANES.tracks}`}>
        {asked.isPending ? (
          <Skeleton label={say('screens.likedView.reading')} className="h-40 w-full" />
        ) : tracks.length === 0 ? (
          <NothingHere
            of={HeartIcon}
            title={say('screens.likedView.emptyTitle')}
            detail={say('screens.likedView.emptyDetail')}
          />
        ) : (
          <TrackList
            label={say('screens.likedView.title')}
            tracks={tracks}
            showsArtwork
            onPlay={(index) => {
              player.play(tracks, index, { source });
            }}
          />
        )}
      </div>
    </article>
  );
};

LikedView.displayName = 'LikedView';

export { LikedView };
