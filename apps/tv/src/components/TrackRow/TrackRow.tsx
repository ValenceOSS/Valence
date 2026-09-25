import { memo } from 'react';
import { NumberedRow } from '@ValenceTv/components/NumberedRow/NumberedRow';
import { say } from '@ValenceI18n/say';
import type { TrackRowProps } from './TrackRow.types';

/**
 * One song in a list of them: where it comes in the list, or bars rising and falling where it is
 * the one playing, its name and who sings it, the album it is from where the list is not one album, and how
 * long it is. The remote lands on the whole row, which turns white.
 *
 * @param track - The song.
 * @param place - Where it comes in the list, counting from nought.
 * @param isCurrent - Whether it is the song playing now.
 * @param isPlaying - Whether the music is playing rather than paused.
 * @param showsAlbum - Whether to say which album it is from.
 * @param onPress - Told where in the list the chosen song comes.
 * @param onFocus - Told where in the list the song the remote is on comes.
 */
const TrackRowLine = ({
  track,
  place,
  isCurrent,
  isPlaying,
  showsAlbum = false,
  onPress,
  onFocus,
}: TrackRowProps) => {
  const artists = track.artists.map((artist) => artist.name).join(', ');

  return (
    <NumberedRow
      label={`${track.title}, ${artists}`}
      title={track.title}
      detail={track.isExplicit ? say('tv.trackRow.explicit', { artists }) : artists}
      {...(showsAlbum ? { aside: track.album.title } : {})}
      length={track.durationSeconds}
      place={place}
      isCurrent={isCurrent}
      isPlaying={isPlaying}
      onPress={onPress}
      {...(onFocus === undefined ? {} : { onFocus })}
    />
  );
};

const TrackRow = memo(TrackRowLine);

TrackRow.displayName = 'TrackRow';

export { TrackRow };
