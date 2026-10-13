import { Easing } from 'react-native';

const EASINGS = {
  inCubic: Easing.in((t) => Easing.cubic(t)),
  inOutCubic: Easing.inOut((t) => Easing.cubic(t)),
  inOutQuad: Easing.inOut((t) => Easing.quad(t)),
  inOutSine: Easing.inOut((t) => Easing.sin(t)),
  inQuad: Easing.in((t) => Easing.quad(t)),
  linear: (t: number) => Easing.linear(t),
  outCubic: Easing.out((t) => Easing.cubic(t)),
  outEager: Easing.bezier(0.22, 1, 0.36, 1),
  outQuad: Easing.out((t) => Easing.quad(t)),
} as const;

export { EASINGS };
