import { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet } from 'react-native';
import { useDrawnElement } from '@ValenceTv/web/useDrawnElement';
import { useKeepsStill } from '@ValenceTv/platform/useKeepsStill';
import type { LiftOnFocusProps } from './LiftOnFocus.types';

const LIFT_MS = 200;

const SHADOW = { blur: 28, drop: 18, opacity: 0.55 };

/**
 * Lifts what it holds while the remote is anywhere inside it, for a television's browser: it grows
 * by the given scale, from its left edge where asked, and a shadow fades in beneath the picture.
 *
 * @param scale - How far it lifts.
 * @param shadowHeight - How tall the picture casting the shadow is, from the top, or nought for none.
 * @param cornerRadius - How rounded that picture is.
 * @param isAnchoredLeft - Whether it grows from its left edge, as a row in a list does.
 * @param style - How it is laid out.
 * @param children - What is lifted.
 */
const LiftOnFocus = ({
  scale,
  shadowHeight,
  cornerRadius,
  isAnchoredLeft,
  style,
  children,
}: LiftOnFocusProps) => {
  const [element, drawn] = useDrawnElement();
  const [lift] = useState(() => new Animated.Value(0));
  const isStill = useKeepsStill();

  useEffect(() => {
    if (element === null) {
      return;
    }

    /**
     * Eases the lift towards being on or off.
     *
     * @param to - Nought for resting, one for lifted.
     */
    const ease = (to: number) => {
      if (isStill) {
        lift.setValue(to);

        return;
      }

      Animated.timing(lift, {
        toValue: to,
        duration: LIFT_MS,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,
      }).start();
    };
    const landed = () => {
      ease(1);
    };
    const left = (event: FocusEvent) => {
      if (!(event.relatedTarget instanceof Node) || !element.contains(event.relatedTarget)) {
        ease(0);
      }
    };

    element.addEventListener('focusin', landed);
    element.addEventListener('focusout', left);

    return () => {
      element.removeEventListener('focusin', landed);
      element.removeEventListener('focusout', left);
    };
  }, [element, isStill, lift]);

  return (
    <Animated.View
      ref={drawn}
      style={[
        style,
        {
          transformOrigin: isAnchoredLeft ? 'left center' : 'center',
          transform: [{ scale: lift.interpolate({ inputRange: [0, 1], outputRange: [1, scale] }) }],
          zIndex: lift.interpolate({ inputRange: [0, 1], outputRange: [0, 1] }),
        },
      ]}
    >
      {shadowHeight > 0 ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.shadow,
            { height: shadowHeight, borderRadius: cornerRadius, opacity: lift },
          ]}
        />
      ) : null}
      {children}
    </Animated.View>
  );
};

LiftOnFocus.displayName = 'LiftOnFocus';

const styles = StyleSheet.create({
  shadow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#000000',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: SHADOW.drop },
    shadowOpacity: SHADOW.opacity,
    shadowRadius: SHADOW.blur,
  },
});

export { LiftOnFocus };
