import { createContext } from 'react';
import type { useOriginOf } from '@ValenceClient/linking/useOriginOf';

const CARD_ORIGINS = createContext<ReturnType<typeof useOriginOf> | null>(null);

export { CARD_ORIGINS };
