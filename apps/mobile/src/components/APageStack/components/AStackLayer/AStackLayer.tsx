import { StyleSheet, View } from 'react-native';
import Animated, { Extrapolation, interpolate, useAnimatedStyle } from 'react-native-reanimated';
import { Screen } from 'react-native-screens';
import { IS_ON_TOP } from '@ValenceMobile/components/APageStack/IS_ON_TOP';
import { PLACE } from '@ValenceMobile/components/APageStack/PLACE';
import type { AStackLayerProps } from './AStackLayer.types';

const UNDER_SHIFT = 0.3;

const UNDER_DIM = 0.25;

const UNDER_A_CARD_SCALE = 0.92;

const UNDER_A_CARD_DIM = 0.4;

const CARD_CORNER = 38;

const GRABBER_WIDE = 56;

const GRABBER_HIGH = 5;

const styles = StyleSheet.create({
  card: {
    borderTopLeftRadius: CARD_CORNER,
    borderTopRightRadius: CARD_CORNER,
    overflow: 'hidden',
  },
  dim: { backgroundColor: '#000000' },
  grabber: {
    alignSelf: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
    borderRadius: GRABBER_HIGH / 2,
    height: GRABBER_HIGH,
    position: 'absolute',
    top: 6,
    width: GRABBER_WIDE,
  },
  underACard: { borderRadius: CARD_CORNER, overflow: 'hidden' },
});

/**
 * One page of the stack, drawn where its place puts it on the interface thread — slid off to the
 * right, drifted left and dimmed beneath the page over it, risen from below, or shrunk back under a
 * card — in a screen of its own, so a page kept frozen beneath the others is taken off the screen
 * natively and stops drawing until it is needed again.
 *
 * @param place - Where it stands, from pushed under through in place to pushed off.
 * @param keeping - Whether it is kept live, on screen, or frozen and off it.
 * @param isTop - Whether it is the page on top, the only one that can be touched or read aloud.
 * @param isUnderACard - Whether a card is laid over it, which shrinks it back rather than sliding it.
 * @param rises - Whether it comes up from below rather than in from the side.
 * @param isStill - Whether to cross-fade rather than move, for somebody who asked for less motion.
 * @param isMoving - Whether it is arriving or leaving, which Android draws from a texture meanwhile.
 * @param cardTop - Where a card stops, just short of the status bar.
 */
const AStackLayer = ({
  place,
  keeping,
  isTop,
  isCard,
  isUnderACard,
  rises,
  isStill,
  isMoving,
  cardTop,
  width,
  height,
  children,
}: AStackLayerProps) => {
  const across = rises || isCard ? height : width;
  const isRisen = rises || isCard;

  const moving = useAnimatedStyle(() => {
    if (isStill) {
      return {
        opacity: interpolate(
          place.get(),
          [PLACE.under, PLACE.inPlace, PLACE.off],
          [1, 1, 0],
          Extrapolation.CLAMP,
        ),
      };
    }

    if (isUnderACard) {
      return {
        transform: [
          {
            scale: interpolate(
              place.get(),
              [PLACE.under, PLACE.inPlace],
              [UNDER_A_CARD_SCALE, 1],
              Extrapolation.CLAMP,
            ),
          },
        ],
      };
    }

    return isRisen
      ? {
          transform: [
            {
              translateY: interpolate(
                place.get(),
                [PLACE.inPlace, PLACE.off],
                [0, across],
                Extrapolation.CLAMP,
              ),
            },
          ],
        }
      : {
          transform: [
            {
              translateX: interpolate(
                place.get(),
                [PLACE.under, PLACE.inPlace, PLACE.off],
                [-across * UNDER_SHIFT, 0, across],
                Extrapolation.CLAMP,
              ),
            },
          ],
        };
  });

  const dimmed = useAnimatedStyle(() => ({
    opacity: interpolate(
      place.get(),
      [PLACE.under, PLACE.inPlace],
      [isUnderACard ? UNDER_A_CARD_DIM : UNDER_DIM, 0],
      Extrapolation.CLAMP,
    ),
  }));

  return (
    <Screen
      style={StyleSheet.absoluteFill}
      activityState={keeping.activity}
      freezeOnBlur
      shouldFreeze={keeping.isFrozen}
      pointerEvents="box-none"
    >
      <IS_ON_TOP.Provider value={isTop}>
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            isCard ? [styles.card, { top: cardTop }] : isUnderACard ? styles.underACard : null,
            moving,
          ]}
          renderToHardwareTextureAndroid={!isTop || isMoving}
          pointerEvents={isTop ? 'auto' : 'none'}
          accessibilityElementsHidden={!isTop}
          importantForAccessibility={isTop ? 'auto' : 'no-hide-descendants'}
        >
          {children}

          {isCard ? <View pointerEvents="none" style={styles.grabber} /> : null}

          {isStill ? null : (
            <Animated.View
              pointerEvents="none"
              style={[StyleSheet.absoluteFill, styles.dim, dimmed]}
            />
          )}
        </Animated.View>
      </IS_ON_TOP.Provider>
    </Screen>
  );
};

AStackLayer.displayName = 'AStackLayer';

export { AStackLayer };
