import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { interpolate, useAnimatedStyle } from 'react-native-reanimated';
import { Screen } from 'react-native-screens';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';
import { CARD_GOES_BACK } from '@ValenceMobile/components/APageStack/CARD_GOES_BACK';
import { CARD_SCROLL } from '@ValenceMobile/components/APageStack/CARD_SCROLL';
import { IS_A_CARD } from '@ValenceMobile/components/APageStack/IS_A_CARD';
import { IS_ON_TOP } from '@ValenceMobile/components/APageStack/IS_ON_TOP';
import type { ACardLayerProps } from './ACardLayer.types';

const SWAPPED_SHIFT = 0.3;

const styles = StyleSheet.create({
  hidden: { opacity: 0 },
  lifted: {
    shadowColor: '#000000',
    shadowOffset: { height: 0, width: -6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
  },
});

/**
 * One of a card's pages, drawn as a card draws it — without the clock's room at its top, told it is
 * a card and whether it goes back to another, able to say when it is scrolled to its top and to hand
 * the card a finger that scrolled it there and kept pulling — and moved on the interface thread while
 * the card swaps one page for another or is swiped back to the one before: the new one sliding in
 * over the old from the right going forward, the old one sliding away to the right going back.
 *
 * @param layer - The page.
 * @param motion - What it is doing: shown, kept hidden beneath, or arriving or leaving.
 * @param keeping - Whether it is kept live, on screen, or frozen and off it.
 * @param isOnTop - Whether it is the page on top of the whole stack.
 * @param isLifted - Whether it moves over another, and so casts a shadow on it.
 * @param isTouchable - Whether a finger can reach it.
 * @param isStill - Whether to cross-fade rather than move, for somebody who asked for less motion.
 * @param swapping - How far a swap of the card's page has gone.
 * @param peeling - How far the card's page has been swiped back.
 * @param insets - The room the screen keeps at its edges, with none at the top.
 * @param onAtTop - Told whether the page is scrolled to its top.
 * @param pullDown - Told how far a finger that scrolled the page to its top has kept pulling.
 * @param letGo - Told that finger let go.
 */
const ACardLayer = ({
  layer,
  motion,
  keeping,
  isOnTop,
  isLifted,
  isTouchable,
  isStill,
  width,
  swapping,
  peeling,
  insets,
  onAtTop,
  pullDown,
  letGo,
}: ACardLayerProps) => {
  const scroll = useMemo(
    () => ({
      atTop: (isAtTop: boolean) => {
        onAtTop(layer.key, isAtTop);
      },
      pullDown,
      letGo,
    }),
    [layer.key, onAtTop, pullDown, letGo],
  );

  const moved = useAnimatedStyle(() => {
    if (motion === 'peelingAway') {
      return isStill
        ? { opacity: interpolate(peeling.get(), [0, 1], [1, 0]) }
        : { transform: [{ translateX: interpolate(peeling.get(), [0, 1], [0, width]) }] };
    }

    if (motion === 'peeledTo') {
      return isStill
        ? {}
        : {
            transform: [
              { translateX: interpolate(peeling.get(), [0, 1], [-width * SWAPPED_SHIFT, 0]) },
            ],
          };
    }

    if (motion === 'goingForward' || motion === 'goingBack') {
      return isStill
        ? { opacity: interpolate(swapping.get(), [0, 1], [1, 0]) }
        : {
            transform: [
              {
                translateX: interpolate(
                  swapping.get(),
                  [0, 1],
                  motion === 'goingForward' ? [0, -width * SWAPPED_SHIFT] : [0, width],
                ),
              },
            ],
          };
    }

    if (motion === 'arrivingForward' || motion === 'arrivingBack') {
      return isStill
        ? { opacity: interpolate(swapping.get(), [0, 1], [0, 1]) }
        : {
            transform: [
              {
                translateX: interpolate(
                  swapping.get(),
                  [0, 1],
                  motion === 'arrivingForward' ? [width, 0] : [-width * SWAPPED_SHIFT, 0],
                ),
              },
            ],
          };
    }

    return {};
  });

  const isHidden = motion === 'hidden';

  return (
    <Screen
      style={StyleSheet.absoluteFill}
      activityState={keeping.activity}
      freezeOnBlur
      shouldFreeze={keeping.isFrozen}
      pointerEvents="box-none"
    >
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          isHidden && styles.hidden,
          moved,
          isLifted && styles.lifted,
        ]}
        pointerEvents={isTouchable ? 'auto' : 'none'}
        accessibilityElementsHidden={isHidden}
        importantForAccessibility={isHidden ? 'no-hide-descendants' : 'auto'}
      >
        <IS_ON_TOP.Provider value={isOnTop}>
          <IS_A_CARD.Provider value>
            <CARD_GOES_BACK.Provider value={layer.goesBack === true}>
              <SafeAreaInsetsContext.Provider value={insets}>
                <CARD_SCROLL.Provider value={scroll}>{layer.page}</CARD_SCROLL.Provider>
              </SafeAreaInsetsContext.Provider>
            </CARD_GOES_BACK.Provider>
          </IS_A_CARD.Provider>
        </IS_ON_TOP.Provider>
      </Animated.View>
    </Screen>
  );
};

ACardLayer.displayName = 'ACardLayer';

export { ACardLayer };
