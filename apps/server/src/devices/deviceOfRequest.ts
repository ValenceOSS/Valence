import { CLIENT_KIND_HEADER } from '@ValenceContracts/constants/CLIENT_KIND_HEADER';
import { DEVICE_HEADER } from '@ValenceContracts/constants/DEVICE_HEADER';
import { readDeviceHints } from '@ValenceContracts/functions/readDeviceHints';
import { ClientKindSchema } from '@ValenceContracts/schemas/ClientKind';
import { identifyDevice } from '@ValenceCore/functions/identifyDevice';
import type { DeviceIdentity } from '@ValenceContracts/schemas/DeviceIdentity';
import { brandsOf } from '@ValenceServer/web/brandsOf';

type RequestDevice = { deviceId: string | null; identity: DeviceIdentity };

/**
 * What device a request came from, from everything it carried about itself: what its client said
 * about the device, the kind of client it said it is, its user agent and its client hints.
 *
 * @param headers - The request's headers, where there were any.
 * @returns Which device it is, where its client said, and what it is.
 */
const deviceOfRequest = (headers: Headers | null | undefined): RequestDevice => {
  const hints = readDeviceHints(headers?.get(DEVICE_HEADER));
  const kind = ClientKindSchema.safeParse(headers?.get(CLIENT_KIND_HEADER));

  return {
    deviceId: hints.id ?? null,
    identity: identifyDevice({
      userAgent: headers?.get('user-agent'),
      brands: brandsOf(headers?.get('sec-ch-ua')),
      kind: kind.success ? kind.data : null,
      hints,
    }),
  };
};

export type { RequestDevice };

export { deviceOfRequest };
