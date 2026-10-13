import { Star } from '@keyline-icons/react-native';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRate } from '@ValenceClient/library/useRate';
import { useStars } from '@ValenceClient/library/useStars';
import { useWatchingProfile } from '@ValenceClient/profiles/useWatchingProfile';
import { viewingQueries } from '@ValenceClient/query/viewingQueries';
import { Button } from '@ValenceMobile/components/Button/Button';
import { Icon } from '@ValenceMobile/components/Icon/Icon';
import { AWavingStar } from '@ValenceMobile/components/TheStars/components/AWavingStar/AWavingStar';
import { FONTS } from '@ValenceMobile/theme/FONTS';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import type { TheStarsProps } from './TheStars.types';
import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';

const OUT_OF = [1, 2, 3, 4, 5] as const;

const LIT = '#fbbf24';

const STAR = 26;

const SMALL_STAR = 14;

const WAVE_STEP = 70;

const styles = StyleSheet.create({
  average: { fontFamily: FONTS.sans.semibold, fontSize: 14, fontVariant: ['tabular-nums'] },
  filled: {
    bottom: 0,
    flexDirection: 'row',
    gap: 2,
    left: 0,
    overflow: 'hidden',
    position: 'absolute',
    top: 0,
  },
  group: { gap: 6 },
  household: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  label: { fontFamily: FONTS.sans.medium, fontSize: 12 },
  row: { flexDirection: 'row', gap: 2 },
  star: { padding: 3 },
  whole: {
    alignSelf: 'stretch',
    columnGap: 32,
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 14,
  },
  count: { fontFamily: FONTS.body.regular, fontSize: 12 },
});

/**
 * The ratings of something, laid out as the web lays them out: your own stars, pressed to give
 * them, with a wave of jumping stars running up to the one pressed — pressing the one already given
 * takes the rating back — and beside them what the household made of it, as stars filled to the
 * average with the average and how many rated it.
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
  const [wave, setWave] = useState({ to: 0, times: 0 });

  return (
    <View style={styles.whole}>
      <View style={styles.group}>
        <Text style={[styles.label, { color: colours.textMuted }]}>
          {say('screens.ratingPanel.you')}
        </Text>

        <View style={styles.row}>
          {OUT_OF.map((stars) => (
            <Button
              key={stars}
              tone="bare"
              label={sayCount('common.count.stars', stars)}
              isChosen={given === stars}
              onPress={() => {
                if (given === stars) {
                  rate(subject, null);

                  return;
                }

                setWave((was) => ({ to: stars, times: was.times + 1 }));
                rate(subject, stars);
              }}
            >
              <View style={styles.star}>
                <AWavingStar
                  isLit={given !== null && stars <= given}
                  wave={stars <= wave.to ? wave.times : 0}
                  delay={(stars - 1) * WAVE_STEP}
                  size={STAR}
                  litColour={LIT}
                  restColour={colours.textMuted}
                />
              </View>
            </Button>
          ))}
        </View>
      </View>

      {average === null || count === 0 ? null : (
        <View style={styles.group}>
          <Text style={[styles.label, { color: colours.textMuted }]}>
            {say('screens.ratingPanel.household')}
          </Text>

          <View style={styles.household}>
            <View accessibilityLabel={`${average.toFixed(1)} / 5`}>
              <View style={styles.row}>
                {OUT_OF.map((stars) => (
                  <Icon key={stars} of={Star} size={SMALL_STAR} colour={colours.textMuted} />
                ))}
              </View>
              <View
                style={[
                  styles.filled,
                  { width: `${((Math.min(Math.max(average, 0), 5) / 5) * 100).toString()}%` },
                ]}
              >
                {OUT_OF.map((stars) => (
                  <Icon key={stars} of={Star} size={SMALL_STAR} colour={LIT} />
                ))}
              </View>
            </View>

            <Text style={[styles.average, { color: colours.text }]}>{average.toFixed(1)}</Text>

            <Text style={[styles.count, { color: colours.textMuted }]}>
              {sayCount('screens.ratingPanel.fromCountRating', count)}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

TheStars.displayName = 'TheStars';

export { TheStars };
