import { ScrollView, StyleSheet, Text, TVFocusGuideView } from 'react-native';
import { Check } from '@keyline-icons/react-native';
import { ActionRow } from '@ValenceTv/components/ActionRow/ActionRow';
import { FadeIn } from '@ValenceTv/components/FadeIn/FadeIn';
import { tokens } from '@ValenceTv/theme/tokens';
import type { TrackMenuProps } from './TrackMenu.types';

const WIDTH = 720;

/**
 * A panel down the right of the picture listing the subtitles, or the sound tracks, there are to
 * choose from, with the one in use ticked, as the television's own player lists them. The remote
 * starts on the one in use; Menu closes it without changing anything.
 *
 * @param title - What is being chosen.
 * @param choices - What there is to choose.
 * @param chosen - The one in use.
 * @param onChoose - Told which was chosen.
 */
const TrackMenu = ({ title, choices, chosen, onChoose }: TrackMenuProps) => (
  <TVFocusGuideView style={styles.panel} trapFocusLeft trapFocusRight trapFocusUp trapFocusDown>
    <FadeIn>
      <Text style={styles.title}>{title}</Text>

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {choices.map((choice) => (
          <ActionRow
            key={choice.id}
            label={choice.label}
            {...(choice.id === chosen ? { icon: Check } : {})}
            hasPreferredFocus={choice.id === chosen}
            onPress={() => {
              onChoose(choice.id);
            }}
          />
        ))}
      </ScrollView>
    </FadeIn>
  </TVFocusGuideView>
);

TrackMenu.displayName = 'TrackMenu';

const styles = StyleSheet.create({
  panel: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: WIDTH,
    paddingTop: tokens.space.xl,
    paddingHorizontal: tokens.space.lg,
    backgroundColor: 'rgba(12,12,12,0.92)',
  },
  title: {
    color: tokens.colours.text,
    fontSize: tokens.type.heading,
    fontWeight: '700',
    marginBottom: tokens.space.md,
    paddingHorizontal: tokens.space.md,
  },
  list: { gap: tokens.space.xs, paddingBottom: tokens.space.xl },
});

export { TrackMenu };
