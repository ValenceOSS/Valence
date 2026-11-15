import { Fragment } from 'react';
import { View } from 'react-native';
import { TheNowPlaying } from '@ValenceMobile/components/ATrackList/components/TheNowPlaying/TheNowPlaying';
import { useTrackRows } from '@ValenceMobile/components/ATrackList/useTrackRows';
import type { ATrackListProps } from './ATrackList.types';

/**
 * A list of tracks, any of which plays the list from there, as the web's track lists do: an
 * album's by their numbers, anything else by their covers. A short list is drawn whole where it
 * stands; a page whose list may run long is handed the rows, to draw only as they come near the
 * screen.
 *
 * @param drawnIn - The page the rows are drawn in, where the list may run long, rather than whole.
 * @param list - The tracks, where they are from, and what can be done with them.
 */
const ATrackList = ({ drawnIn, ...list }: ATrackListProps) => {
  const rows = useTrackRows(list);

  return (
    <TheNowPlaying>
      {drawnIn === undefined ? (
        <View>
          {Array.from({ length: rows.count }, (_, at) => (
            <Fragment key={rows.keyOf(at)}>{rows.draw(at)}</Fragment>
          ))}
        </View>
      ) : (
        drawnIn(rows)
      )}
    </TheNowPlaying>
  );
};

ATrackList.displayName = 'ATrackList';

export { ATrackList };
