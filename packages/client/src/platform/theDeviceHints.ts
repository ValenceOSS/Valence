import { DeviceHintsSchema } from '@ValenceContracts/schemas/DeviceHints';
import type { DeviceHints } from '@ValenceContracts/schemas/DeviceHints';
import { platformIfAny } from '@ValenceClient/platform/installPlatform';
import { thisDevicesId } from '@ValenceClient/platform/thisDevicesId';

/**
 * What this client says about the device it runs on — which device it is, and what its host knows
 * that a user agent cannot say — trimmed to what the server will read.
 *
 * @returns What to tell the server, or nothing before a host is installed.
 */
const theDeviceHints = (): DeviceHints => {
  const platform = platformIfAny();

  if (platform === null) {
    return {};
  }

  return DeviceHintsSchema.parse({ ...platform.describeThisDevice(), id: thisDevicesId() });
};

export { theDeviceHints };
