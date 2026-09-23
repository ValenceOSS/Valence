import { createContext } from 'react';
import type { Animated } from 'react-native';

const ARRIVING = createContext<Animated.Value | null>(null);

export { ARRIVING };
