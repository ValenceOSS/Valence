import { Star } from '@keyline-icons/react-native';
import { Star as StarFilled } from '@keyline-icons/react-native/fill';
import { useQuery } from '@tanstack/react-query';
import { StyleSheet, View } from 'react-native';
import { useRate } from '@ValenceClient/library/useRate';
import { useStars } from '@ValenceClient/library/useStars';
import { useWatchingProfile } from '@ValenceClient/profiles/useWatchingProfile';
import { viewingQueries } from '@ValenceClient/query/viewingQueries';
import { Button } from '@ValenceMobile/components/Button/Button';
import { Icon } from '@ValenceMobile/components/Icon/Icon';
import { Words } from '@ValenceMobile/components/Words/Words';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import type { TheStarsProps } from './TheStars.types';

const OUT_OF = [1, 2, 3, 4, 5] as const;

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 6 },
  star: { padding: 4 },
  whole: { alignItems: 'center', gap: 6 },
});

/**
 * Your own stars for something, out of five, and what the rest of the household made of it.
 *
 * Pressing the star already given takes the rating back.
 *
 * @param subject - What is being rated: a title, a programme or a book.
 */
const TheStars = ({ subject }: TheStarsProps) => {
  const colours = useTheColours();
  const watching = useWatchingProfile();
  const given = useStars(watching, subject);
  const rate = useRate(watching);
  const household = useQuery(viewingQueries.household(subject));
  const average = household.data?.average ?? null;
  const count = household.data?.count ?? 0;

  return (
    <View style={styles.whole}>
      <Words size="small" tone="muted">
        Your rating
      </Words>

      <View style={styles.row}>
        {OUT_OF.map((stars) => (
          <Button
            key={stars}
            tone="bare"
            label={stars === 1 ? '1 star' : `${stars.toString()} stars`}
            isChosen={given === stars}
            onPress={() => {
              rate(subject, given === stars ? null : stars);
            }}
          >
            <View style={styles.star}>
              <Icon
                of={given !== null && stars <= given ? StarFilled : Star}
                size={26}
                colour={given !== null && stars <= given ? colours.highlight : colours.textMuted}
              />
            </View>
          </Button>
        ))}
      </View>

      {average === null || count === 0 ? null : (
        <Words size="small" tone="muted">
          {`Household ${average.toFixed(1)} from ${count.toString()} ${count === 1 ? 'rating' : 'ratings'}`}
        </Words>
      )}
    </View>
  );
};

TheStars.displayName = 'TheStars';

export { TheStars };
