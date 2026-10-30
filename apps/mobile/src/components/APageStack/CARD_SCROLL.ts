import { createContext } from 'react';

const CARD_SCROLL = createContext<((isAtTop: boolean) => void) | null>(null);

export { CARD_SCROLL };
