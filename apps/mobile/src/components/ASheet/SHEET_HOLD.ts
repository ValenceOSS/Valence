import { createContext } from 'react';

const SHEET_HOLD = createContext<((isHeld: boolean) => void) | null>(null);

export { SHEET_HOLD };
