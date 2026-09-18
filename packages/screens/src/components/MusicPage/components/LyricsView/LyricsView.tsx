import { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useReducedMotionConfig } from 'motion/react';
import { Mic01Icon, MusicNote01Icon } from '@hugeicons/core-free-icons';
import { Button } from '@ValenceUI/Button';
import { NothingHere } from '@ValenceUI/NothingHere';
import { Skeleton } from '@ValenceUI/Skeleton';
import { cn } from '@ValenceUI/cn';
import { albumArtworkUrl } from '@ValenceClient/music/fetchMusic';
import { lyricLineAt } from '@ValenceClient/music/lyricLineAt';
import { musicQueries } from '@ValenceClient/query/musicQueries';
import { useArtworkTint } from '@ValenceScreens/music/useArtworkTint';
import { useMusicPlayer } from '@ValenceScreens/music/useMusicPlayer';
import { useWhatIsPlaying } from '@ValenceScreens/music/useWhatIsPlaying';

/**
 * The words of the song playing, set large on the colour of its sleeve.
 *
 * Lyrics that carry the time each line is sung follow the song: the line being sung is lit, the
 * ones already sung fade, and the page keeps it in the middle of the screen. Pressing a line goes to
 * that point in the song. Lyrics without times are shown whole and left alone.
 */
const LyricsView = () => {
  const { state, player } = useMusicPlayer();
  const shown = useWhatIsPlaying(state);
  const trackId = shown?.trackId ?? null;
  const asked = useQuery({ ...musicQueries.lyrics(trackId ?? ''), enabled: trackId !== null });
  const tint = useArtworkTint(
    shown !== null && shown.hasArtwork ? albumArtworkUrl(shown.albumId) : null,
  );
  const prefersReducedMotion = useReducedMotionConfig();
  const lineRefs = useRef(new Map<number, HTMLElement>());
  const lyrics = asked.data ?? null;
  const at =
    lyrics === null || !lyrics.isSynced
      ? -1
      : lyricLineAt(lyrics.lines, (shown?.positionSeconds ?? 0) * 1000);

  useEffect(() => {
    const line = lineRefs.current.get(at);

    line?.scrollIntoView({
      block: 'center',
      behavior: prefersReducedMotion === true ? 'auto' : 'smooth',
    });
  }, [at, prefersReducedMotion]);

  if (shown === null) {
    return (
      <NothingHere
        of={MusicNote01Icon}
        title="Nothing is playing"
        detail="Play a song to follow its words here."
        fills
      />
    );
  }

  if (asked.isPending) {
    return (
      <div className="flex flex-col gap-6 p-10">
        <Skeleton label="Reading the lyrics" className="h-12 w-3/4" />
        <Skeleton className="h-12 w-2/3" />
        <Skeleton className="h-12 w-1/2" />
      </div>
    );
  }

  if (lyrics === null || lyrics.lines.length === 0) {
    return (
      <NothingHere
        of={Mic01Icon}
        title={`No lyrics for ${shown.title}`}
        detail="Lyrics are read from the song's own tags, or from an .lrc file kept beside it."
        fills
      />
    );
  }

  return (
    <section
      aria-label={`Lyrics for ${shown.title}`}
      className={cn(
        'min-h-full px-6 py-12 transition-colors duration-700 sm:px-12 lg:px-16',
        tint === null ? '' : 'text-on-scrim',
      )}
      style={
        tint === null ? undefined : { backgroundColor: `color-mix(in oklab, ${tint} 78%, black)` }
      }
    >
      <ol className="flex flex-col gap-4 sm:gap-6">
        {lyrics.lines.map((line, index) => {
          const { atMs } = line;
          const isNow = index === at;
          const isSung = lyrics.isSynced && index < at;
          const words = line.text === '' ? '♪' : line.text;
          const drawn = cn(
            'text-left text-[clamp(1.5rem,3.6vw,3rem)] font-bold leading-[1.12] tracking-[-0.025em] transition-[opacity,color] duration-300',
            !lyrics.isSynced
              ? 'opacity-90'
              : isNow
                ? 'opacity-100'
                : isSung
                  ? 'opacity-35'
                  : 'opacity-60',
          );

          return (
            <li
              key={`${index.toString()}-${line.text}`}
              ref={(element) => {
                if (element === null) {
                  lineRefs.current.delete(index);
                } else {
                  lineRefs.current.set(index, element);
                }
              }}
              {...(isNow ? { 'aria-current': 'true' } : {})}
            >
              {atMs === null ? (
                <p className={drawn}>{words}</p>
              ) : (
                <Button
                  variant="bare"
                  size="none"
                  hasTooltip={false}
                  className={cn(drawn, 'hover:opacity-100')}
                  onClick={() => {
                    player.seek(atMs / 1000);
                  }}
                >
                  {words}
                </Button>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
};

LyricsView.displayName = 'LyricsView';

export { LyricsView };
