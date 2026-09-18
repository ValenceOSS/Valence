import { useQuery } from '@tanstack/react-query';
import { FavouriteIcon, PlayIcon, ShuffleIcon } from '@hugeicons/core-free-icons';
import { Button } from '@ValenceUI/Button';
import { CouldNotRead } from '@ValenceUI/CouldNotRead';
import { Icon } from '@ValenceUI/Icon';
import { NothingHere } from '@ValenceUI/NothingHere';
import { Skeleton } from '@ValenceUI/Skeleton';
import { formatDuration } from '@ValenceCore/functions/formatDuration';
import { musicQueries } from '@ValenceClient/query/musicQueries';
import { MusicHeader } from '@ValenceScreens/components/MusicHeader/MusicHeader';
import { TrackList } from '@ValenceScreens/components/TrackList/TrackList';
import { useMusicPlayer } from '@ValenceScreens/music/useMusicPlayer';

const SOURCE = { kind: 'liked', id: null, name: 'Liked Songs' } as const;

/**
 * Every song this profile has liked, newest first — a playlist nobody has to make, kept by pressing
 * the heart beside a song anywhere.
 */
const LikedView = () => {
  const asked = useQuery(musicQueries.liked());
  const { player } = useMusicPlayer();
  const tracks = asked.data ?? [];
  const total = tracks.reduce((sum, track) => sum + track.durationSeconds, 0);

  if (asked.isError) {
    return (
      <CouldNotRead
        what="your liked songs"
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
        eyebrow="Playlist"
        title="Liked Songs"
        tint="var(--color-text-muted)"
        artwork={
          <span className="flex aspect-square w-full items-center justify-center rounded-md bg-text text-surface">
            <Icon of={FavouriteIcon} size={72} isActive />
          </span>
        }
        details={
          <span>
            {tracks.length === 1 ? '1 song' : `${tracks.length.toString()} songs`} ·{' '}
            {formatDuration(total)}
          </span>
        }
        actions={
          <>
            <Button
              variant="glossy"
              size="lg"
              isIconOnly
              label="Play Liked Songs"
              className="size-14"
              disabled={tracks.length === 0}
              onClick={() => {
                player.play(tracks, 0, { source: SOURCE });
              }}
            >
              <Icon of={PlayIcon} size={24} isActive />
            </Button>
            <Button
              variant="ghost"
              size="md"
              isIconOnly
              label="Shuffle Liked Songs"
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

      <div className="px-3 pb-10 sm:px-5">
        {asked.isPending ? (
          <Skeleton label="Reading your liked songs" className="h-40 w-full" />
        ) : tracks.length === 0 ? (
          <NothingHere
            of={FavouriteIcon}
            title="Songs you like will be here"
            detail="Press the heart beside any song to keep it."
          />
        ) : (
          <TrackList
            label="Liked Songs"
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
