import { useQuery } from '@tanstack/react-query';
import { Shuffle as ShuffleIcon, Sparkles as SparklesIcon } from '@keyline-icons/react';
import { Play as PlayFilledIcon } from '@keyline-icons/react/fill';
import { Button } from '@ValenceUI/Button';
import { CouldNotRead } from '@ValenceUI/CouldNotRead';
import { Icon } from '@ValenceUI/Icon';
import { Skeleton } from '@ValenceUI/Skeleton';
import { formatDuration } from '@ValenceCore/functions/formatDuration';
import { albumArtworkUrl } from '@ValenceClient/music/fetchMusic';
import { musicQueries } from '@ValenceClient/query/musicQueries';
import { useMusicPlayer } from '@ValenceClient/music/useMusicPlayer';
import { useLightTheMusic } from '@ValenceScreens/music/useLightTheMusic';
import { MUSIC_LANES } from '@ValenceScreens/music/musicLanes';
import { PlaylistCover } from '@ValenceScreens/components/PlaylistCover/PlaylistCover';
import { MusicHeader } from '@ValenceScreens/components/MusicHeader/MusicHeader';
import { TrackList } from '@ValenceScreens/components/TrackList/TrackList';
import type { MixViewProps } from './MixView.types';
import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';

/**
 * One of the mixes Valence made for this profile today, drawn as a playlist is: a cover of the
 * albums in it, what it is, and its songs to play in order or shuffled.
 *
 * @param mixId - Which mix.
 */
const MixView = ({ mixId }: MixViewProps) => {
  const asked = useQuery(musicQueries.mix(mixId));
  const { player } = useMusicPlayer();
  const mix = asked.data;
  const tracks = mix?.tracks ?? [];
  const covers = mix?.coverAlbumIds ?? [];
  const title = mix?.title ?? '';
  const source = { kind: 'tracks', id: mixId, name: title } as const;
  const total = tracks.reduce((sum, track) => sum + track.durationSeconds, 0);

  useLightTheMusic(covers[0] === undefined ? null : albumArtworkUrl(covers[0]));

  if (asked.isError) {
    return (
      <CouldNotRead
        said={say('error.music.thereIsNoSuchMixToday')}
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
        eyebrow={say('common.mixByValence')}
        title={title}
        artwork={
          <PlaylistCover
            name={title}
            albumIds={covers}
            standIn={SparklesIcon}
            iconSize={72}
            className="w-full"
          />
        }
        details={
          <span>
            {mix?.detail} · {sayCount('common.count.songs', tracks.length)} ·{' '}
            {formatDuration(total)}
          </span>
        }
        actions={
          <>
            <Button
              variant="confirm"
              size="lg"
              isIconOnly
              label={say('common.play')}
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
              label={say('common.shuffle')}
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
          <Skeleton label={say('common.madeForYou')} className="h-40 w-full" />
        ) : (
          <TrackList
            label={title}
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

MixView.displayName = 'MixView';

export { MixView };
