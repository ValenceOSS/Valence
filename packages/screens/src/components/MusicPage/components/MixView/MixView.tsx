import { PlayAndShuffle } from '@ValenceScreens/components/MusicPage/components/PlayAndShuffle/PlayAndShuffle';
import { useQuery } from '@tanstack/react-query';
import { CouldNotRead } from '@ValenceUI/CouldNotRead';
import { Skeleton } from '@ValenceUI/Skeleton';
import { formatDuration } from '@ValenceCore/functions/formatDuration';
import { albumArtworkUrl } from '@ValenceClient/music/fetchMusic';
import { musicQueries } from '@ValenceClient/query/musicQueries';
import { useMusicPlayer } from '@ValenceClient/music/useMusicPlayer';
import { useLightTheMusic } from '@ValenceScreens/music/useLightTheMusic';
import { MUSIC_LANES } from '@ValenceScreens/music/musicLanes';
import { MixArtwork } from '@ValenceScreens/components/MixArtwork/MixArtwork';
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

  const heading = covers[0] === undefined ? null : albumArtworkUrl(covers[0]);

  useLightTheMusic(heading);

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
        backdrop={heading}
        artwork={
          mix === undefined ? undefined : (
            <MixArtwork mix={mix} number={Number(mixId.replace('daily-', '')) || 1} />
          )
        }
        details={
          <span>
            {mix?.detail} · {sayCount('common.count.songs', tracks.length)} ·{' '}
            {formatDuration(total)}
          </span>
        }
        actions={
          <>
            <PlayAndShuffle
              tracks={tracks}
              source={source}
              playLabel={say('common.play')}
              shuffleLabel={say('common.shuffle')}
            />
          </>
        }
      />

      <div className={`pb-10 ${MUSIC_LANES.tracks}`}>
        {asked.isPending ? (
          <Skeleton label={say('common.madeForYou')} className="h-40 w-full" />
        ) : (
          <TrackList
            hasHeading
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
