import { useQuery } from '@tanstack/react-query';
import { isStyledSubtitle } from '@ValenceContracts/functions/isStyledSubtitle';
import { playbackQueries } from '@ValenceClient/query/playbackQueries';
import type { SubtitleCue } from '@ValenceClient/playback/fetchSubtitleCues';
import type { SubtitleTrack } from '@ValenceClient/playback/fetchSubtitles';

const NO_CUES: SubtitleCue[] = [];

/**
 * The lines of the track somebody is reading, for a client that draws its own subtitles, shared by
 * the phone, the television and the browser so that a track reads the same on all of them.
 *
 * A script is asked for twice at once: as its own lines, kept where they go and dressed as they
 * were, and as plain WebVTT. The plain lines are drawn until the script's arrive, or for good where
 * it has none, so a script whose first read is slow is late in its styling rather than missing.
 * Every other track is only ever plain.
 *
 * Neither is given up on. A read the server could not make is made again until it can, and is
 * kept once made, so coming back from another window or another episode draws at once.
 *
 * @param mediaId - What is playing.
 * @param track - The track being read, or none where nothing is or it is drawn into the picture.
 * @returns The lines to draw.
 */
const useSubtitleCues = (mediaId: string, track: SubtitleTrack | null): SubtitleCue[] => {
  const trackId = track?.id ?? '';
  const isStyled = track !== null && isStyledSubtitle(track.format);
  const styled = useQuery({ ...playbackQueries.styledCues(mediaId, trackId), enabled: isStyled });
  const isStyledLate = styled.data === undefined || styled.data === null;
  const plain = useQuery({
    ...playbackQueries.plainCues(mediaId, trackId),
    enabled: track !== null && (!isStyled || isStyledLate),
  });

  if (track === null) {
    return NO_CUES;
  }

  return (isStyled ? styled.data : null) ?? plain.data ?? NO_CUES;
};

export { useSubtitleCues };
