import { useQuery } from '@tanstack/react-query';
import { ActivityIndicator } from 'react-native';
import { lyricLineAt } from '@ValenceClient/music/lyricLineAt';
import { musicQueries } from '@ValenceClient/query/musicQueries';
import { AFadedEdge } from '@ValenceMobile/components/AFadedEdge/AFadedEdge';
import { TheSungLines } from '@ValenceMobile/components/TheMusicPlayer/components/TheLyrics/components/TheSungLines/TheSungLines';
import { useWhereTheSongIs } from '@ValenceMobile/components/TheMusicPlayer/useWhereTheSongIs';
import { Words } from '@ValenceMobile/components/Words/Words';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import type { TheLyricsProps } from './TheLyrics.types';

const FADES_IN_OVER = 24;

const FADES_OUT_OVER = 64;

/**
 * A track's words, the way Apple Music shows them in place of the cover and the web's immersive
 * music shows them over it: large, with the line being sung bright and sharp and the rest dimmed and
 * out of focus the further they are from it, carried up the screen as the song goes so the line
 * being sung stays near the top. The words fade out at the top and bottom rather than being cut off.
 * Pressing a line of timed words plays from it. Somebody scrolling through the words is left to it
 * for a moment before the song takes the words back.
 *
 * Words that are not timed are simply there, all of them evenly lit.
 *
 * @param trackId - Whose words.
 * @param onSeek - Told to play from a moment, where a timed line was pressed.
 */
const TheLyrics = ({ trackId, onSeek }: TheLyricsProps) => {
  const colours = useTheColours();
  const read = useQuery(musicQueries.lyrics(trackId));
  const atSeconds = useWhereTheSongIs();

  if (read.isPending) {
    return <ActivityIndicator color={colours.textMuted} />;
  }

  const lines = read.data?.lines ?? [];

  if (lines.length === 0) {
    return (
      <Words tone="muted" isCentred>
        There are no words for this one.
      </Words>
    );
  }

  const isSynced = read.data?.isSynced === true;

  return (
    <AFadedEdge leading={FADES_IN_OVER} trailing={FADES_OUT_OVER} isUpright>
      <TheSungLines
        lines={lines}
        isSynced={isSynced}
        sung={isSynced ? lyricLineAt(lines, atSeconds * 1000) : -1}
        onSeek={onSeek}
      />
    </AFadedEdge>
  );
};

TheLyrics.displayName = 'TheLyrics';

export { TheLyrics };
