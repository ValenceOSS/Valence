import { useCallback, useRef } from 'react';
import type { LibraryKind } from '@ValenceContracts/schemas/Library';
import type { Surprise } from '@ValenceClient/library/pickAnything.types';

/**
 * Chooses something at random for as long as it is asked to, but only one choice at a time. A pick
 * reads whole libraries to make its choice, so answering every press of an impatient thumb started a
 * pile of them, and each one then opened its own result on top of the last.
 *
 * @param pick - Chooses something, from a kind of library where one is named.
 * @param onFound - Told what was chosen.
 * @returns What to call to ask for another, which does nothing while the last is still choosing.
 */
const useSurprise = (
  pick: (only?: LibraryKind) => Promise<Surprise | null>,
  onFound: (found: Surprise) => void,
): ((only?: LibraryKind) => void) => {
  const isPicking = useRef(false);

  return useCallback(
    (only?: LibraryKind) => {
      if (isPicking.current) {
        return;
      }

      isPicking.current = true;

      void pick(only)
        .then((found) => {
          if (found !== null) {
            onFound(found);
          }
        })
        .finally(() => {
          isPicking.current = false;
        });
    },
    [pick, onFound],
  );
};

export { useSurprise };
