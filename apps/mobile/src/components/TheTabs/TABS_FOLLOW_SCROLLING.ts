import { createContext } from 'react';

const TABS_FOLLOW_SCROLLING = createContext<((scrolledTo: number) => void) | null>(null);

export { TABS_FOLLOW_SCROLLING };
