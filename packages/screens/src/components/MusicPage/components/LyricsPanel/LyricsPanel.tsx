import { Mic as MicIcon, MusicNote as MusicNoteIcon } from '@keyline-icons/react';
import { NothingHere } from '@ValenceUI/NothingHere';
import { Skeleton } from '@ValenceUI/Skeleton';
import { LyricLines } from '@ValenceScreens/components/LyricLines/LyricLines';
import { useSongLyrics } from '@ValenceScreens/music/useSongLyrics';
import { say } from '@ValenceI18n/say';

/**
 * The words of the song playing, in the panel beside the music, the way the queue sits there: small
 * enough to read alongside whatever page is open, following along with the song, with the line
 * being sung kept in the middle of the panel. Pressing a timed line goes to it. A song with none
 * says so, plainly.
 */
const LyricsPanel = () => {
  const { player, shown, lyrics, isReading, at } = useSongLyrics();

  if (shown === null) {
    return (
      <NothingHere
        of={MusicNoteIcon}
        title={say('common.nothingIsPlaying2')}
        detail={say('common.playASongToFollowIts')}
      />
    );
  }

  if (isReading) {
    return (
      <div className="flex flex-col gap-3 px-2 py-2">
        <Skeleton label={say('common.readingTheLyrics')} className="h-6 w-3/4" />
        <Skeleton className="h-6 w-2/3" />
        <Skeleton className="h-6 w-1/2" />
      </div>
    );
  }

  if (lyrics === null || lyrics.lines.length === 0) {
    return <NothingHere of={MicIcon} title={say('common.noLyricsFound')} />;
  }

  return (
    <section
      aria-label={say('common.lyricsForTitle', { title: shown.title })}
      className="px-2 pt-2 pb-40"
    >
      <LyricLines
        lyrics={lyrics}
        at={at}
        look="panel"
        onSeek={(seconds) => {
          player.seek(seconds);
        }}
      />
    </section>
  );
};

LyricsPanel.displayName = 'LyricsPanel';

export { LyricsPanel };
