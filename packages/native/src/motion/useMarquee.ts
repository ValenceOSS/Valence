import { useEffect, useState } from 'react';
import { Animated, Easing } from 'react-native';
import { usePrefersStillness } from './usePrefersStillness';

const POINTS_A_SECOND = 28;

const RESTS_MS = 1800;

type Marquee = {
  along: Animated.Value;
  isStill: boolean;
  onRoom: (width: number) => void;
  onWanted: (width: number) => void;
};

type MarqueeOptions = {
  pointsASecond?: number;
  restartsWith?: string;
};

/**
 * How far a line too long for its room has slid along to show the rest of itself — resting at its
 * start, sliding on the native driver until its end shows, resting there and sliding back — and
 * keeping still where it fits, or where somebody has asked for less motion.
 *
 * @param options - How many points a second it slides, and what starts it again from its start when
 *   it changes, such as the words it holds.
 * @returns How far along it is, whether it keeps still, and where to say how wide the room and the
 *   line are.
 */
const useMarquee = ({
  pointsASecond = POINTS_A_SECOND,
  restartsWith = '',
}: MarqueeOptions = {}): Marquee => {
  const isStill = usePrefersStillness();
  const [room, setRoom] = useState(0);
  const [wanted, setWanted] = useState(0);
  const [along] = useState(() => new Animated.Value(0));
  const over = Math.max(0, wanted - room);

  useEffect(() => {
    along.setValue(0);

    if (isStill || over < 1 || room === 0) {
      return undefined;
    }

    const sliding = (toValue: number) =>
      Animated.timing(along, {
        toValue,
        duration: (over / pointsASecond) * 1000,
        easing: (at) => Easing.inOut((t) => Easing.quad(t))(at),
        useNativeDriver: true,
      });
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(RESTS_MS),
        sliding(-over),
        Animated.delay(RESTS_MS),
        sliding(0),
      ]),
    );

    loop.start();

    return () => {
      loop.stop();
    };
  }, [over, room, isStill, along, pointsASecond, restartsWith]);

  return { along, isStill, onRoom: setRoom, onWanted: setWanted };
};

export type { Marquee };

export { useMarquee };
