import { useContext } from 'react';
import { IS_ON_TOP } from '@ValencePhone/components/APageStack/IS_ON_TOP';

/**
 * Whether the page this is drawn on is the one on top, rather than one covered by a page pushed
 * over it, so something that plays or listens can stop while nobody can see it.
 *
 * @returns Whether it is on top.
 */
const useIsOnTop = (): boolean => useContext(IS_ON_TOP);

export { useIsOnTop };
