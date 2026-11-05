import { Mic as MicIcon, MusicNote as MusicNoteIcon } from '@keyline-icons/react';
import { NothingHere } from '@ValenceUI/NothingHere';
import { Skeleton } from '@ValenceUI/Skeleton';
import { albumArtworkUrl } from '@ValenceClient/music/fetchMusic';
import { LikeTrackButton } from '@ValenceScreens/components/LikeTrackButton/LikeTrackButton';
import { LyricLines } from '@ValenceScreens/components/LyricLines/LyricLines';
import { MusicArtwork } from '@ValenceScreens/components/MusicArtwork/MusicArtwork';
import { useArtworkTint } from '@ValenceScreens/music/useArtworkTint';
import { useSongLyrics } from '@ValenceScreens/music/useSongLyrics';
import { say } from '@ValenceI18n/say';

/**
 * The song playing, in the column beside the music: its cover large, what it is and who it is by,
 * then its words in a card of their own tinted from the cover, following along with the line being
 * sung kept in the middle of the card. Pressing a timed line goes to it. A song with none says so,
 * plainly.
 */
const LyricsPanel = () => {
  const { player, shown, lyrics, isReading, at } = useSongLyrics();
  const cover = shown !== null && shown.hasArtwork ? albumArtworkUrl(shown.albumId) : null;
  const tint = useArtworkTint(cover);

  if (shown === null) {
    return (
      <NothingHere
        of={MusicNoteIcon}
        title={say('common.nothingIsPlaying')}
        detail={say('common.playASongToFollowIts')}
      />
    );
  }

  return (
    <section
      aria-label={say('common.lyricsForTitle', { title: shown.title })}
      className="flex h-full flex-col gap-3 pt-1"
    >
      <MusicArtwork
        src={cover}
        label={shown.albumTitle ?? shown.title}
        className="w-full shrink-0"
      />

      <div className="flex shrink-0 items-center justify-between gap-3 px-1">
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-lg font-bold tracking-[-0.02em] text-text">
            {shown.title}
          </span>
          <span className="truncate text-sm text-text-muted">
            {shown.artists.map((artist) => artist.name).join(', ')}
          </span>
        </span>
        <LikeTrackButton trackId={shown.trackId} title={shown.title} className="shrink-0" />
      </div>

      <div
        className="flex min-h-[16rem] flex-1 flex-col overflow-hidden rounded-[0.875rem] bg-hover"
        style={
          tint === null
            ? undefined
            : {
                backgroundColor: `color-mix(in oklab, ${tint} 38%, var(--color-surface-raised))`,
              }
        }
      >
        <h3 className="px-4 pt-3.5 text-sm font-semibold text-text">{say('common.lyrics')}</h3>

        {isReading ? (
          <div className="flex flex-col gap-3 p-4">
            <Skeleton label={say('common.readingTheLyrics')} className="h-5 w-3/4" />
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-5 w-1/2" />
          </div>
        ) : lyrics === null || lyrics.lines.length === 0 ? (
          <NothingHere of={MicIcon} title={say('common.noLyricsFound')} isCompact />
        ) : (
          <div className="valence-rail min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-24 [mask-image:linear-gradient(to_bottom,transparent,black_2rem,black_calc(100%-2rem),transparent)]">
            <LyricLines
              lyrics={lyrics}
              at={at}
              look="panel"
              onSeek={(seconds) => {
                player.seek(seconds);
              }}
            />
          </div>
        )}
      </div>
    </section>
  );
};

LyricsPanel.displayName = 'LyricsPanel';

export { LyricsPanel };
