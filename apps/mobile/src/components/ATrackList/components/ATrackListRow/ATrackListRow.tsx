import { useContext } from 'react';
import { StyleSheet, View } from 'react-native';
import { withAlpha } from '@ValenceCore/functions/withAlpha';
import { ATrackRow } from '@ValenceMobile/components/ATrackRow/ATrackRow';
import { NOW_PLAYING } from '@ValenceMobile/components/ATrackList/NOW_PLAYING';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import type { ATrackListRowProps } from './ATrackListRow.types';

const styles = StyleSheet.create({
  divided: { borderTopWidth: StyleSheet.hairlineWidth },
});

/**
 * One track of a list, ruled off from the one above it and picked out where it is the song playing.
 *
 * @param isFirst - Whether it is at the top of the list, with nothing above it to be ruled off from.
 * @param rest - The track and what can be done with it.
 */
const ATrackListRow = ({ isFirst, ...rest }: ATrackListRowProps) => {
  const colours = useTheColours();
  const { currentId, isPlaying } = useContext(NOW_PLAYING);
  const isCurrent = currentId === rest.track.id;

  return (
    <View
      style={isFirst ? null : [styles.divided, { borderTopColor: withAlpha(colours.text, 0.14) }]}
    >
      <ATrackRow {...rest} isCurrent={isCurrent} isPlaying={isCurrent && isPlaying} />
    </View>
  );
};

ATrackListRow.displayName = 'ATrackListRow';

export { ATrackListRow };
