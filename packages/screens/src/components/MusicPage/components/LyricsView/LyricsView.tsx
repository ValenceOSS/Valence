import { useQuery } from '@tanstack/react-query';
import { Mic as MicIcon, MusicNote as MusicNoteIcon } from '@keyline-icons/react';
import { NothingHere } from '@ValenceUI/NothingHere';
import { Skeleton } from '@ValenceUI/Skeleton';
import { albumArtworkUrl } from '@ValenceClient/music/fetchMusic';
import { lyricLineAt } from '@ValenceClient/music/lyricLineAt';
import { musicQueries } from '@ValenceClient/query/musicQueries';
import { CoverGlow } from '@ValenceScreens/components/CoverGlow/CoverGlow';
import { LyricLines } from '@ValenceScreens/components/LyricLines/LyricLines';
import { MUSIC_LANES } from '@ValenceScreens/music/musicLanes';
import { useLightTheMusic } from '@ValenceScreens/music/useLightTheMusic';
import { useMusicPlayer } from '@ValenceScreens/music/useMusicPlayer';
import { useWhatIsPlaying } from '@ValenceClient/music/useWhatIsPlaying';

/**
 * The words of the song playing, following along with it.
 *
 * The words stand on the song's cover, blown up and blurred into light and held still behind them
 * as they scroll, the way the immersive view is — and, as there, every line but the one being sung
 * drifts out of focus. Timed words keep the line being sung in the middle of the page; words that
 * are not timed are simply shown. A song with none says so, plainly.
 */
const LyricsView = () => {
  const { state, player } = useMusicPlayer(undefined, { followsPosition: true });
  const shown = useWhatIsPlaying(state);
  const trackId = shown?.trackId ?? null;
  const asked = useQuery({ ...musicQueries.lyrics(trackId ?? ''), enabled: trackId !== null });
  const lyrics = asked.data ?? null;
  const at =
    lyrics === null || !lyrics.isSynced
      ? -1
      : lyricLineAt(lyrics.lines, (shown?.positionSeconds ?? 0) * 1000);

  const cover = shown !== null && shown.hasArtwork ? albumArtworkUrl(shown.albumId) : null;

  useLightTheMusic(cover);

  if (shown === null) {
    return (
      <NothingHere
        of={MusicNoteIcon}
        title="Nothing is playing"
        detail="Play a song to follow its words here."
        fills
      />
    );
  }

  if (asked.isPending) {
    return (
      <div className={`flex flex-col gap-6 py-10 ${MUSIC_LANES.page}`}>
        <Skeleton label="Reading the lyrics" className="h-12 w-3/4" />
        <Skeleton className="h-12 w-2/3" />
        <Skeleton className="h-12 w-1/2" />
      </div>
    );
  }

  if (lyrics === null || lyrics.lines.length === 0) {
    return <NothingHere of={MicIcon} title="No lyrics found" fills />;
  }

  return (
    <section aria-label={`Lyrics for ${shown.title}`} className="relative text-on-scrim">
      <div aria-hidden className="sticky top-0 -mb-[100cqh] h-[100cqh]">
        <CoverGlow src={cover} className="absolute inset-0" />
      </div>

      <div className={`relative pt-6 pb-[30cqh] ${MUSIC_LANES.page}`}>
        <LyricLines
          lyrics={lyrics}
          at={at}
          onSeek={(seconds) => {
            player.seek(seconds);
          }}
        />
      </div>
    </section>
  );
};

LyricsView.displayName = 'LyricsView';

export { LyricsView };
