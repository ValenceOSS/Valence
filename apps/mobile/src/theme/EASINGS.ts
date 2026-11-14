import { Easing } from 'react-native';

const EASINGS = {
  drawer: Easing.bezier(0.32, 0.72, 0, 1),
  inOutCubic: Easing.inOut((t) => Easing.cubic(t)),
  inOutQuad: Easing.inOut((t) => Easing.quad(t)),
  inOutSine: Easing.inOut((t) => Easing.sin(t)),
  linear: (t: number) => Easing.linear(t),
  out: Easing.bezier(0.23, 1, 0.32, 1),
  outCubic: Easing.out((t) => Easing.cubic(t)),
  outEager: Easing.bezier(0.22, 1, 0.36, 1),
  outQuad: Easing.out((t) => Easing.quad(t)),
} as const;

export { EASINGS };
