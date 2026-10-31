import { ChevronDown, RotateCcw } from '@keyline-icons/react-native';
import { Play } from '@keyline-icons/react-native/fill';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '@ValenceMobile/components/Button/Button';
import { Icon } from '@ValenceMobile/components/Icon/Icon';
import { ASpinner } from '@ValenceMobile/components/ASpinner/ASpinner';
import { FONTS } from '@ValenceMobile/theme/FONTS';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import { withAlpha } from '@ValenceCore/functions/withAlpha';
import type { APlayButtonProps } from './APlayButton.types';
import { say } from '@ValenceI18n/say';

const TALL = 52;

const CORNER = 14;

const JOIN = 4;

const TRACK = 40;

const styles = StyleSheet.create({
  again: {
    alignItems: 'center',
    borderBottomLeftRadius: JOIN,
    borderBottomRightRadius: CORNER,
    borderTopLeftRadius: JOIN,
    borderTopRightRadius: CORNER,
    height: TALL,
    justifyContent: 'center',
    width: TALL + 4,
  },
  button: {
    alignItems: 'center',
    alignSelf: 'stretch',
    borderRadius: CORNER,
    flexDirection: 'row',
    gap: 10,
    height: TALL,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  joined: { borderBottomRightRadius: JOIN, borderTopRightRadius: JOIN },
  main: { flex: 1 },
  said: { fontFamily: FONTS.sans.bold, fontSize: 17 },
  split: { flexDirection: 'row', gap: 3 },
  track: { borderRadius: 2, height: 4, overflow: 'hidden', width: TRACK },
  watched: { height: '100%' },
});

/**
 * The way to watch what a card is about, as one wide button in the page's own ink, its corners
 * rounded as the phone's own are: a play mark and what pressing it does, and, where somebody has
 * started it, a short bar of how far they got. Where it carries on from part way, a second short
 * segment joined to its end, lit faintly as the round buttons beneath are, starts it again from the
 * beginning, as a split button does.
 *
 * The same button does a card's main thing where that is not watching, such as asking for a film,
 * with its own mark in place of the play mark; while what it started is going it holds a spinner
 * and cannot be pressed again.
 *
 * @param says - What pressing it does.
 * @param onPress - Told it was pressed, or nothing where a menu around it opens instead, when it
 *   is only drawn, with a chevron saying a menu drops from it.
 * @param icon - The mark beside what it says, where it is not the play mark.
 * @param isBusy - Whether what it started is still going.
 * @param isDisabled - Whether it can be pressed at all.
 * @param watched - How much of it has been watched, from nothing to all of it, where any has.
 * @param onStartAgain - Told to play it from the beginning, where it would otherwise carry on.
 */
const APlayButton = ({
  says,
  onPress,
  icon = Play,
  isBusy = false,
  isDisabled = false,
  watched = null,
  onStartAgain,
}: APlayButtonProps) => {
  const colours = useTheColours();
  const play = (
    <Button
      tone="bare"
      label={says}
      isDisabled={isDisabled || isBusy}
      {...(onPress === undefined ? { isOnlyDrawn: true } : { onPress })}
    >
      <View
        style={[
          styles.button,
          onStartAgain !== undefined && styles.joined,
          { backgroundColor: colours.text },
        ]}
      >
        {isBusy ? (
          <ASpinner colour={colours.surface} />
        ) : (
          <>
            <Icon of={icon} size={18} colour={colours.surface} />
            <Text numberOfLines={1} style={[styles.said, { color: colours.surface }]}>
              {says}
            </Text>
            {onPress === undefined ? (
              <Icon of={ChevronDown} size={16} colour={colours.surface} />
            ) : null}
          </>
        )}
        {watched === null ? null : (
          <View style={[styles.track, { backgroundColor: withAlpha(colours.surface, 0.2) }]}>
            <View
              style={[
                styles.watched,
                {
                  backgroundColor: colours.surface,
                  width: `${(Math.min(Math.max(watched, 0), 1) * 100).toString()}%`,
                },
              ]}
            />
          </View>
        )}
      </View>
    </Button>
  );

  return onStartAgain === undefined ? (
    play
  ) : (
    <View style={styles.split}>
      <View style={styles.main}>{play}</View>
      <Button tone="bare" label={say('common.startAgain')} onPress={onStartAgain}>
        <View style={[styles.again, { backgroundColor: withAlpha(colours.text, 0.12) }]}>
          <Icon of={RotateCcw} size={20} colour={colours.text} />
        </View>
      </Button>
    </View>
  );
};

APlayButton.displayName = 'APlayButton';

export { APlayButton };
