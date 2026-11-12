import { StyleSheet, View } from 'react-native';
import { ABadge } from '@ValenceMobile/components/ABadge/ABadge';
import { AnAgeRating } from '@ValenceMobile/components/TheBadges/components/AnAgeRating/AnAgeRating';
import { Words } from '@ValenceMobile/components/Words/Words';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import type { AnOpenedHeadlineProps } from './AnOpenedHeadline.types';

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    columnGap: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    rowGap: 8,
  },
});

/**
 * A title's facts and badges as one row, for the open inside of a folding phone, which has the room
 * for them side by side: the year and the rest, the age rating's own mark, and the quality and the
 * status as chips of one height and one quiet look, the status carrying any colour it means.
 *
 * @param facts - The facts, as they read.
 * @param rating - The age rating, where there is one.
 * @param quality - The quality badges, such as 4K or SD.
 * @param statuses - The status chips, such as whether a programme is returning.
 */
const AnOpenedHeadline = ({ facts, rating, quality, statuses }: AnOpenedHeadlineProps) => {
  const colours = useTheColours();

  return (
    <View style={styles.row}>
      {facts === '' ? null : (
        <Words size="lead" tone="muted">
          {facts}
        </Words>
      )}
      {rating === null ? null : (
        <AnAgeRating
          certification={rating.certification}
          region={rating.region}
          ink={colours.textMuted}
          isLarge
          isSolid
        />
      )}
      {quality.map((badge) => (
        <ABadge key={badge} tone="quiet" isLarge>
          {badge}
        </ABadge>
      ))}
      {statuses.map((status) => (
        <ABadge
          key={status.label}
          {...(status.tone === undefined ? {} : { tone: status.tone })}
          {...(status.icon === undefined ? {} : { icon: status.icon })}
          isLarge
        >
          {status.label}
        </ABadge>
      ))}
    </View>
  );
};

AnOpenedHeadline.displayName = 'AnOpenedHeadline';

export { AnOpenedHeadline };
