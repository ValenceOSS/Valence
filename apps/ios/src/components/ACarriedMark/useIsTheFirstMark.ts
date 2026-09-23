import { useContext, useState } from 'react';
import { THE_MARKS_PLACE } from '@ValencePhone/components/ACarriedMark/THE_MARKS_PLACE';

/**
 * Whether no mark has been on screen yet since the app opened, which is the one time the mark
 * arrives on its own — large in the middle of the screen — rather than gliding in from where the
 * last screen had it.
 *
 * @returns Whether this is the first.
 */
const useIsTheFirstMark = (): boolean => {
  const way = useContext(THE_MARKS_PLACE);
  const [isFirst] = useState(() => !way.hasShown());

  return isFirst;
};

export { useIsTheFirstMark };
