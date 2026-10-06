import { useEffect, useState } from 'react';
import { Animated, PanResponder, Pressable, View } from 'react-native';
import type { GestureResponderEvent } from 'react-native';
import { ALeaf } from './components/ALeaf/ALeaf';
import type { ASpreadProps } from './ASpread.types';

const MOST_ZOOM = 4;

const LET_GO_BELOW = 1.05;

/**
 * How far apart the first two fingers on the screen are.
 *
 * @param event - The touch.
 * @returns The distance between them, or nothing where there are not two.
 */
const apartOf = (event: GestureResponderEvent): number => {
  const [one, other] = event.nativeEvent.touches;

  return one === undefined || other === undefined
    ? 0
    : Math.hypot(one.pageX - other.pageX, one.pageY - other.pageY);
};

/**
 * The pages showing at once — one, or two bound down the middle — which two fingers pinch closer
 * and one finger then moves about, while the book holds still under them.
 *
 * Pinched back to its own size, it settles there and lets the book turn again. A tap anywhere is
 * passed up with where on the screen it landed, for the book to decide what it means.
 *
 * @param leaves - Each page's picture, or nothing for a blank leaf, in the order they lie.
 * @param fit - How each picture fills its leaf.
 * @param breadth - How wide the spread is.
 * @param tall - How tall the spread is.
 * @param isRightToLeft - Whether the book is read right to left, its first leaf on the right.
 * @param onTap - Told where a tap landed, across the screen.
 * @param onZoomed - Told whether the spread is drawn closer than its own size.
 */
const ASpread = ({ leaves, fit, breadth, tall, isRightToLeft, onTap, onZoomed }: ASpreadProps) => {
  const [scale] = useState(() => new Animated.Value(1));
  const [shift] = useState(() => new Animated.ValueXY({ x: 0, y: 0 }));
  const [held] = useState(() => ({
    zoom: 1,
    x: 0,
    y: 0,
    apart: 0,
    fromZoom: 1,
    fromX: 0,
    fromY: 0,
  }));
  const [latest] = useState(() => new Map([['now', { onZoomed, breadth, tall }]]));

  useEffect(() => {
    latest.set('now', { onZoomed, breadth, tall });
  });

  const [responder] = useState(() =>
    PanResponder.create({
      onMoveShouldSetPanResponderCapture: (event) =>
        event.nativeEvent.touches.length === 2 || held.zoom > 1,
      onPanResponderGrant: (event) => {
        const now = held;

        now.apart = apartOf(event);
        now.fromZoom = now.zoom;
        now.fromX = now.x;
        now.fromY = now.y;
      },
      onPanResponderMove: (event, gesture) => {
        const now = held;

        if (event.nativeEvent.touches.length === 2) {
          const apart = apartOf(event);

          if (now.apart === 0) {
            now.apart = apart;
            now.fromZoom = now.zoom;

            return;
          }

          now.zoom = Math.min(MOST_ZOOM, Math.max(1, (now.fromZoom * apart) / now.apart));
          scale.setValue(now.zoom);
        }

        if (now.zoom > 1) {
          const { breadth: wide, tall: high } = latest.get('now') ?? { breadth, tall };
          const roomAcross = (wide * (now.zoom - 1)) / 2;
          const roomDown = (high * (now.zoom - 1)) / 2;

          now.x = Math.min(roomAcross, Math.max(-roomAcross, now.fromX + gesture.dx));
          now.y = Math.min(roomDown, Math.max(-roomDown, now.fromY + gesture.dy));
          shift.setValue({ x: now.x, y: now.y });
        }
      },
      onPanResponderTerminationRequest: () => false,
      onPanResponderRelease: () => {
        const now = held;

        now.apart = 0;

        if (now.zoom < LET_GO_BELOW) {
          now.zoom = 1;
          now.x = 0;
          now.y = 0;
          Animated.parallel([
            Animated.spring(scale, { toValue: 1, useNativeDriver: true }),
            Animated.spring(shift, { toValue: { x: 0, y: 0 }, useNativeDriver: true }),
          ]).start();
        }

        latest.get('now')?.onZoomed(now.zoom > 1);
      },
    }),
  );

  const leaf = breadth / Math.max(1, leaves.length);

  return (
    <View style={{ height: tall, overflow: 'hidden', width: breadth }} {...responder.panHandlers}>
      <Pressable
        onPress={(event) => {
          onTap(event.nativeEvent.pageX);
        }}
      >
        <Animated.View
          style={{
            flexDirection: isRightToLeft ? 'row-reverse' : 'row',
            height: tall,
            transform: [{ translateX: shift.x }, { translateY: shift.y }, { scale }],
            width: breadth,
          }}
        >
          {leaves.map((uri, at) => (
            <ALeaf
              key={uri ?? `blank-${at.toString()}`}
              uri={uri}
              fit={fit}
              breadth={leaf}
              tall={tall}
            />
          ))}
        </Animated.View>
      </Pressable>
    </View>
  );
};

ASpread.displayName = 'ASpread';

export { ASpread };
