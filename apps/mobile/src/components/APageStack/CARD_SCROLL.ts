import { createContext } from 'react';
import type { ACardScroll } from './APageStack.types';

const CARD_SCROLL = createContext<ACardScroll | null>(null);

export { CARD_SCROLL };
