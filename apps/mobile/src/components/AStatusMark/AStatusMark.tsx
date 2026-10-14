import { useEffect, useState } from 'react';
import { Animated, Easing, View } from 'react-native';
import Svg, { Circle, ClipPath, Defs, G, Path, Rect } from 'react-native-svg';
import { usePrefersStillness } from '@ValenceNative/motion/usePrefersStillness';
import type { AStatusMarkProps, AStatusMarkState } from './AStatusMark.types';

const MORPHS_MS = 420;

const MARCHES_MS = 1400;

const RING = 61.7;

const RING_DASHES = '4.63 3.08';

const RING_STEP = 7.71;

const PIE = 22.62;

const TICK = 10.97;

const SLASH = 15.84;

const TONES = {
  waiting: '#eab308',
  halfway: '#f97316',
  nearly: '#22c55e',
  done: '#3b82f6',
  failed: '#ef4444',
} as const;

const EASE = Easing.bezier(0.22, 1, 0.36, 1);

const AnimatedRect = Animated.createAnimatedComponent(Rect);

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const AnimatedPath = Animated.createAnimatedComponent(Path);

const AnimatedG = Animated.createAnimatedComponent(G);

/**
 * The colour a state is drawn in, progress taking gold, then orange, then green as it nears the
 * end.
 *
 * @param state - How it stands.
 * @param progress - How far along, from nothing to the whole.
 * @param colour - The quiet ink for waiting, ready and cancelled.
 * @returns The colour.
 */
const toneOf = (state: AStatusMarkState, progress: number, colour: string): string => {
  switch (state) {
    case 'progress':
      return progress < 0.375 ? TONES.waiting : progress < 0.625 ? TONES.halfway : TONES.nearly;
    case 'done':
      return TONES.done;
    case 'failed':
      return TONES.failed;
    case 'loading':
    case 'idle':
    case 'cancelled':
      return colour;
  }
};

/**
 * Valence's one mark for how something stands, as the web draws it: a rounded square whose dashes
 * march round it while it waits, join into an outline once it is ready, fill clockwise as it makes
 * progress, then draw a tick when it is done, fold the tick into a cross when it is cancelled, and
 * stretch the cross into a slash when it fails — every change a morph of the same few strokes.
 *
 * @param state - How it stands.
 * @param colour - The quiet ink for waiting, ready and cancelled.
 * @param progress - How far along, from nothing to the whole, while it is making progress.
 * @param size - How wide it is drawn.
 * @param label - What it stands for, read out where nothing beside it says so.
 */
const AStatusMark = ({ state, colour, progress = 0, size = 24, label }: AStatusMarkProps) => {
  const isStill = usePrefersStillness();
  const filled = state === 'progress' ? Math.min(Math.max(progress, 0), 1) : 0;
  const tone = toneOf(state, filled, colour);
  const [tones, setTones] = useState({ from: tone, to: tone });
  const [moves] = useState(() => ({
    dashed: new Animated.Value(state === 'loading' ? 1 : 0),
    march: new Animated.Value(0),
    fill: new Animated.Value(filled),
    tick: new Animated.Value(state === 'done' ? 1 : 0),
    cross: new Animated.Value(state === 'cancelled' ? 1 : 0),
    slash: new Animated.Value(state === 'failed' ? 1 : 0),
    tint: new Animated.Value(1),
  }));

  useEffect(() => {
    setTones((was) => (was.to === tone ? was : { from: was.to, to: tone }));
  }, [tone]);

  useEffect(() => {
    const to = (value: Animated.Value, end: number) =>
      Animated.timing(value, {
        toValue: end,
        duration: isStill ? 0 : MORPHS_MS,
        easing: EASE,
        useNativeDriver: false,
      });

    moves.tint.setValue(0);

    const morph = Animated.parallel([
      to(moves.dashed, state === 'loading' ? 1 : 0),
      to(moves.fill, filled),
      to(moves.tick, state === 'done' ? 1 : 0),
      to(moves.cross, state === 'cancelled' ? 1 : 0),
      to(moves.slash, state === 'failed' ? 1 : 0),
      to(moves.tint, 1),
    ]);

    morph.start();

    return () => {
      morph.stop();
    };
  }, [state, filled, isStill, moves, tones]);

  useEffect(() => {
    if (state !== 'loading' || isStill) {
      return undefined;
    }

    moves.march.setValue(0);

    const marching = Animated.loop(
      Animated.timing(moves.march, {
        toValue: -RING_STEP,
        duration: MARCHES_MS,
        easing: (t) => t,
        useNativeDriver: false,
      }),
    );

    marching.start();

    return () => {
      marching.stop();
    };
  }, [state, isStill, moves]);

  const ink = moves.tint.interpolate({ inputRange: [0, 1], outputRange: [tones.from, tones.to] });

  return (
    <View
      style={{ height: size, width: size }}
      {...(label === undefined
        ? { accessibilityElementsHidden: true, importantForAccessibility: 'no-hide-descendants' }
        : { accessibilityRole: 'image', accessibilityLabel: label })}
    >
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Defs>
          <ClipPath id="inside">
            <Rect x={7} y={7} width={10} height={10} rx={2.5} />
          </ClipPath>
        </Defs>

        <AnimatedRect
          x={3}
          y={3}
          width={18}
          height={18}
          rx={6}
          stroke={ink}
          strokeWidth={2}
          strokeLinecap="round"
          strokeDasharray={moves.dashed.interpolate({
            inputRange: [0, 1],
            outputRange: [`${RING.toString()} 0`, RING_DASHES],
          })}
          strokeDashoffset={moves.march}
        />

        <AnimatedCircle
          cx={12}
          cy={12}
          r={3.6}
          stroke={ink}
          strokeWidth={7.2}
          strokeDasharray={moves.fill.interpolate({
            inputRange: [0, 1],
            outputRange: [`0 ${PIE.toString()}`, `${PIE.toString()} ${PIE.toString()}`],
          })}
          rotation={-90}
          origin="12, 12"
          clipPath="url(#inside)"
        />

        <AnimatedPath
          d="M8.25 12.4l2.6 2.6 4.9-5.4"
          stroke={ink}
          strokeWidth={2.2}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={`${TICK.toString()} ${TICK.toString()}`}
          strokeDashoffset={moves.tick.interpolate({ inputRange: [0, 1], outputRange: [TICK, 0] })}
          opacity={moves.tick}
        />

        <AnimatedG opacity={moves.cross} scale={moves.cross} origin="12, 12">
          <Path d="M9.25 9.25l5.5 5.5" stroke={tones.to} strokeWidth={2.2} strokeLinecap="round" />
          <Path
            d="M14.75 9.25l-5.5 5.5"
            stroke={tones.to}
            strokeWidth={2.2}
            strokeLinecap="round"
          />
        </AnimatedG>

        <AnimatedPath
          d="M17.6 6.4L6.4 17.6"
          stroke={ink}
          strokeWidth={2.2}
          strokeLinecap="round"
          strokeDasharray={moves.slash.interpolate({
            inputRange: [0, 1],
            outputRange: [`0 ${SLASH.toString()}`, `${SLASH.toString()} ${SLASH.toString()}`],
          })}
          strokeDashoffset={moves.slash.interpolate({
            inputRange: [0, 1],
            outputRange: [-SLASH / 2, 0],
          })}
          opacity={moves.slash}
        />
      </Svg>
    </View>
  );
};

AStatusMark.displayName = 'AStatusMark';

export { AStatusMark };
