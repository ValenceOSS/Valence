import { filesOfKeptListening } from '@ValenceClient/downloads/filesOfKeptListening';
import type { DeviceStore } from '@ValenceClient/platform/Platform.types';
import type { KeptListening, KeptListeningFile } from '@ValenceContracts/schemas/KeptListening';

/**
 * Writes down that a device already keeps some music or audiobooks, every file of them in one
 * state, as though it had been kept before the app last closed.
 *
 * @param store - Where the device writes things down.
 * @param kept - What it keeps.
 * @param state - Where every file of it has got to.
 */
const keptAlready = (
  store: DeviceStore,
  kept: readonly KeptListening[],
  state: KeptListeningFile['state'] = 'here',
): void => {
  const files = kept.flatMap((one) =>
    filesOfKeptListening(one, () => true).map((file) => ({
      ...file,
      state,
      bytes: state === 'here' ? 1000 : 0,
      ofBytes: state === 'here' ? 1000 : null,
      failure: null,
    })),
  );

  store.write('valence.kept.listening', JSON.stringify({ kept, files }));
};

export { keptAlready };
