import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { watchDeviceChanges } from '@ValenceClient/devices/watchDeviceChanges';
import { platformInUse } from '@ValenceClient/platform/installPlatform';
import { videoQueries } from '@ValenceClient/query/videoQueries';
import type { VideoDevice } from '@ValenceContracts/schemas/VideoRemote';

/**
 * This person's other devices a film could be sent to, kept fresh by the socket: read again the
 * moment one opens or closes, or says it is watching something else, rather than every few seconds.
 *
 * @param isWanted - Whether anything is showing them now.
 * @returns The other devices, televisions first.
 */
const useVideoDevices = (isWanted = true): VideoDevice[] => {
  const cache = useQueryClient();
  const asked = useQuery({ ...videoQueries.devices(), enabled: isWanted });

  useEffect(() => {
    if (!isWanted) {
      return;
    }

    return watchDeviceChanges('videoDevicesChanged', () => {
      void cache.invalidateQueries({ queryKey: videoQueries.devices().queryKey });
    });
  }, [cache, isWanted]);

  const here = platformInUse().thisClientId();

  return (asked.data ?? [])
    .filter((device) => device.clientId !== here)
    .sort((one, other) => Number(other.kind === 'tv') - Number(one.kind === 'tv'));
};

export { useVideoDevices };
