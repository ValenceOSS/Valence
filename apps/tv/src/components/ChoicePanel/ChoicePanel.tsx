import { FlatList, StyleSheet, Text, TVFocusGuideView, View } from 'react-native';
import { Check } from '@keyline-icons/react-native/fill';
import { FadeIn } from '@ValenceTv/components/FadeIn/FadeIn';
import { Focusable } from '@ValenceTv/components/Focusable/Focusable';
import { Icon } from '@ValenceTv/components/Icon/Icon';
import { tokens } from '@ValenceTv/theme/tokens';
import type { ChoicePanelProps } from './ChoicePanel.types';

const WIDTH = 720;

const DRAWN_PAST_THE_CHOSEN = 6;

/**
 * A list to choose one from, in a panel down the right of the screen as the player's settings are
 * — how fast to play, when to stop, which chapter — with a tick beside the one chosen now, where
 * the remote starts. Menu closes the panel, and the remote stays inside it until then.
 *
 * @param title - What is being chosen.
 * @param choices - What there is to choose from, each saying whether it is the one chosen now.
 * @param onChoose - Told which was chosen.
 */
const ChoicePanel = ({ title, choices, onChoose }: ChoicePanelProps) => {
  const chosenAt = Math.max(
    choices.findIndex((choice) => choice.isCurrent),
    0,
  );

  return (
    <TVFocusGuideView style={styles.panel} trapFocusLeft trapFocusRight trapFocusUp trapFocusDown>
      <FadeIn>
        <Text style={styles.title}>{title}</Text>

        <FlatList
          data={choices}
          keyExtractor={(choice) => choice.id}
          initialNumToRender={chosenAt + DRAWN_PAST_THE_CHOSEN}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => (
            <Focusable
              label={item.detail === undefined ? item.label : `${item.label}, ${item.detail}`}
              scale={1}
              hasPreferredFocus={index === chosenAt}
              onPress={() => {
                onChoose(item.id);
              }}
            >
              {(isFocused) => {
                const ink = isFocused ? tokens.colours.onWhite : tokens.colours.text;
                const quiet = isFocused ? tokens.colours.onWhite : tokens.colours.muted;

                return (
                  <View style={[styles.row, isFocused && styles.focused]}>
                    <View style={styles.tick}>
                      {item.isCurrent ? <Icon of={Check} size={28} colour={ink} /> : null}
                    </View>

                    <Text numberOfLines={1} style={[styles.label, { color: ink }]}>
                      {item.label}
                    </Text>

                    {item.detail === undefined ? null : (
                      <Text style={[styles.detail, { color: quiet }]}>{item.detail}</Text>
                    )}
                  </View>
                );
              }}
            </Focusable>
          )}
        />
      </FadeIn>
    </TVFocusGuideView>
  );
};

ChoicePanel.displayName = 'ChoicePanel';

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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space.sm,
    paddingHorizontal: tokens.space.md,
    paddingVertical: tokens.space.sm,
    borderRadius: tokens.radii.lg,
  },
  focused: { backgroundColor: '#ffffff' },
  tick: { width: 36, alignItems: 'center' },
  label: { flex: 1, fontSize: tokens.type.body, fontWeight: '600' },
  detail: { fontSize: tokens.type.small, fontVariant: ['tabular-nums'] },
});

export { ChoicePanel };
