import { KBPS_IN_A_MBPS } from '@ValenceCore/tokens/KBPS_IN_A_MBPS';
import type { StreamLimit } from '@ValenceContracts/schemas/StreamLimit';
import type { TypedStreamLimit } from '@ValenceScreens/components/AdminArea/components/StreamLimitCard/StreamLimitCard.types';

/**
 * What a limit's fields hold for a limit as it is saved: the bitrate in megabits, either number left
 * empty where there is no limit, and the quality and whether downloads are held to it as they are.
 *
 * @param own - The limit as it is saved, or nothing before it has been read.
 * @returns What each field holds.
 */
const typedStreamLimitOf = (own: StreamLimit | undefined): TypedStreamLimit => ({
  bitrate:
    own === undefined || own.maxBitrateKbps === null
      ? ''
      : (own.maxBitrateKbps / KBPS_IN_A_MBPS).toString(),
  streams: own === undefined || own.maxStreams === null ? '' : own.maxStreams.toString(),
  quality: own?.maxQuality ?? null,
  limitsDownloads: own?.limitsDownloads ?? false,
});

export { typedStreamLimitOf };
