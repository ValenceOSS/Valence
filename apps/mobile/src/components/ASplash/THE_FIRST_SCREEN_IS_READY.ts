import { createContext } from 'react';

const THE_FIRST_SCREEN_IS_READY = createContext<() => void>(() => undefined);

export { THE_FIRST_SCREEN_IS_READY };
