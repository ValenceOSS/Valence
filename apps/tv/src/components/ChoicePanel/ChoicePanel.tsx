import { FlatList, StyleSheet, Text, View } from 'react-native';
import { Check } from '@keyline-icons/react-native/fill';
import { X } from '@keyline-icons/react-native';
import { Button } from '@ValenceTv/components/Button/Button';
import { say } from '@ValenceI18n/say';
import { FadeIn } from '@ValenceTv/components/FadeIn/FadeIn';
import { Focusable } from '@ValenceTv/components/Focusable/Focusable';
import { Icon } from '@ValenceTv/components/Icon/Icon';
import { tokens } from '@ValenceTv/theme/tokens';
import type { ChoicePanelProps } from './ChoicePanel.types';
import { FocusGuide } from '@ValenceTv/components/FocusGuide/FocusGuide';

const WIDTH = 720;

const DRAWN_PAST_THE_CHOSEN = 6;

/**
 * A list to choose one from, in a panel down the right of the screen as the player's settings are
 * — how fast to play, when to stop, which chapter — with a tick beside the one chosen now, where
 * the remote starts. It sits on a solid sheet over the page, dimmed behind it; Menu closes it, as
 * does the close button at its head where it is given one, and the remote stays inside it until then.
 *
 * @param title - What is being chosen.
 * @param choices - What there is to choose from, each saying whether it is the one chosen now and
 *   whether what it says beside it has been set.
 * @param onChoose - Told which was chosen.
 * @param onClose - Told when the close button is pressed; without it, there is no close button.
 */
const ChoicePanel = ({ title, choices, onChoose, onClose }: ChoicePanelProps) => {
  const chosenAt = Math.max(
    choices.findIndex((choice) => choice.isCurrent),
    0,
  );
  const hasTicks = choices.some((choice) => choice.isCurrent);

  return (
    <>
      <View pointerEvents="none" style={styles.dim} />
      <FocusGuide style={styles.panel} trapsLeft trapsRight trapsUp trapsDown>
        <FadeIn>
          <View style={styles.head}>
            <Text style={styles.title}>{title}</Text>

            {onClose === undefined ? null : (
              <Button
                label={say('common.close')}
                icon={X}
                variant="glass"
                size="md"
                isIconOnly
                onPress={onClose}
              />
            )}
          </View>

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
                      {hasTicks ? (
                        <View style={styles.tick}>
                          {item.isCurrent ? <Icon of={Check} size={28} colour={ink} /> : null}
                        </View>
                      ) : null}

                      <Text numberOfLines={1} style={[styles.label, { color: ink }]}>
                        {item.label}
                      </Text>

                      {item.detail === undefined ? null : (
                        <Text
                          style={[
                            styles.detail,
                            item.isSet === true && styles.set,
                            { color: item.isSet === true ? ink : quiet },
                          ]}
                        >
                          {item.detail}
                        </Text>
                      )}
                    </View>
                  );
                }}
              </Focusable>
            )}
          />
        </FadeIn>
      </FocusGuide>
    </>
  );
};

ChoicePanel.displayName = 'ChoicePanel';

const styles = StyleSheet.create({
  dim: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  panel: {
    position: 'absolute',
    top: tokens.space.lg,
    right: tokens.space.lg,
    bottom: tokens.space.lg,
    width: WIDTH,
    paddingTop: tokens.space.lg,
    paddingHorizontal: tokens.space.md,
    borderRadius: tokens.radii.xl,
    borderWidth: 1,
    borderColor: tokens.colours.line,
    backgroundColor: tokens.colours.raised,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: tokens.space.md,
    paddingHorizontal: tokens.space.md,
  },
  title: {
    color: tokens.colours.text,
    fontSize: tokens.type.heading,
    fontWeight: '700',
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
  focused: { backgroundColor: '#ffffff', borderRadius: tokens.radii.lg },
  tick: { width: 36, alignItems: 'center' },
  label: { flex: 1, fontSize: tokens.type.body, fontWeight: '600' },
  detail: { fontSize: tokens.type.small, fontVariant: ['tabular-nums'] },
  set: { fontWeight: '700' },
});

export { ChoicePanel };
