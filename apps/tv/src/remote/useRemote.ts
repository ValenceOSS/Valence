import { useCallback } from 'react';
import { Platform, useTVEventHandler } from 'react-native';
import type { HWEvent } from 'react-native';
import { readTheRemote } from '@ValenceTv/remote/readTheRemote';

/**
 * Tells a screen what the remote's buttons do, said the same way on every television: what the Siri
 * Remote says it hears as it is, and what an Android remote says read as the Siri Remote would have
 * said it.
 *
 * @param hear - Told of each button pressed or held.
 */
const useRemote = (hear: (event: HWEvent) => void): void => {
  const read = useCallback(
    (event: HWEvent) => {
      hear(Platform.OS === 'android' ? readTheRemote(event) : event);
    },
    [hear],
  );

  useTVEventHandler(read);
};

export { useRemote };
