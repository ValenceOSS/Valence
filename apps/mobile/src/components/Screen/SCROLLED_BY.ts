import { createContext } from 'react';
import type { Animated } from 'react-native';

const SCROLLED_BY = createContext<Animated.Value | null>(null);

export { SCROLLED_BY };
