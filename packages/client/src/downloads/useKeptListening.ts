import { useEffect, useMemo, useState } from 'react';
import { theKeptListening } from '@ValenceClient/downloads/theKeptListening';
import { platformInUse } from '@ValenceClient/platform/installPlatform';
import type { KeptListening, KeptListeningShelf } from '@ValenceContracts/schemas/KeptListening';

/**
 * The music and audiobooks this device keeps from the server in use, kept up to date as their
 * files arrive.
 *
 * @returns What is kept, and the files it is kept as.
 */
const useKeptListening = (): KeptListeningShelf & { here: KeptListening[] } => {
  const [shelf, setShelf] = useState(() => theKeptListening().shelf());
  const server = platformInUse().serverAddress();

  useEffect(() => {
    setShelf(theKeptListening().shelf());

    return theKeptListening().whenChanged(setShelf);
  }, []);

  return useMemo(
    () => ({
      ...shelf,
      here: shelf.kept.filter((kept) => kept.server === null || kept.server === server),
    }),
    [shelf, server],
  );
};

export { useKeptListening };
