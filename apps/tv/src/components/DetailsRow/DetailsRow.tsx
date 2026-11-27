import { StyleSheet, Text, View } from 'react-native';
import { TomatoMark } from '@ValenceTv/components/TomatoMark/TomatoMark';
import { tokens } from '@ValenceTv/theme/tokens';
import type { DetailsRowProps } from './DetailsRow.types';
import { say } from '@ValenceI18n/say';

/**
 * The facts about a title worth a line each — when it came out, how it stands, what it cost and
 * made, what the critics thought — set across the page under a heading, each its name above its
 * value, as the phone's title card lists them, the critics' score led by Rotten Tomatoes' tomato or
 * splat as the web leads it. There is nothing to choose in it, so the remote passes over it.
 * Nothing is drawn where no fact is known.
 *
 * @param details - A label and a value for each fact, and the critics' score where it is that.
 */
const DetailsRow = ({ details }: DetailsRowProps) => {
  if (details.length === 0) {
    return null;
  }

  return (
    <View style={styles.section}>
      <Text style={styles.heading}>{say('common.details')}</Text>

      <View style={styles.facts}>
        {details.map((detail) => (
          <View key={detail.label} style={styles.fact}>
            <Text style={styles.label}>{detail.label}</Text>
            <View style={styles.valued}>
              {detail.tomato === undefined ? null : <TomatoMark score={detail.tomato} />}

              <Text style={styles.value}>{detail.value}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

DetailsRow.displayName = 'DetailsRow';

const styles = StyleSheet.create({
  section: { gap: tokens.space.sm, paddingVertical: tokens.space.md },
  heading: {
    color: tokens.colours.text,
    fontSize: tokens.type.body,
    fontWeight: '600',
    paddingHorizontal: tokens.space.edge,
  },
  facts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: tokens.space.xl,
    rowGap: tokens.space.md,
    paddingHorizontal: tokens.space.edge,
  },
  fact: { gap: 4 },
  label: { color: tokens.colours.muted, fontSize: tokens.type.small },
  valued: { flexDirection: 'row', alignItems: 'center', gap: tokens.space.xs },
  value: { color: tokens.colours.text, fontSize: tokens.type.body, fontWeight: '600' },
});

export { DetailsRow };
