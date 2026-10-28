import type {
  HardwareDeviceSetting,
  WhenDevicesFull,
} from '@ValenceContracts/schemas/DevicePlacement';
import type { TranscodeDevice } from '@ValenceContracts/schemas/TranscodeDevice';
import type { Placement } from '@ValenceServer/transcoder/TranscoderClient';
import { orderDevices } from '@ValenceContracts/functions/orderDevices';

type PlacementSettings = {
  spreadAcrossDevices: boolean;
  hardwareDevices: readonly HardwareDeviceSetting[];
  whenDevicesFull: WhenDevicesFull;
};

/**
 * Works out which graphics devices the media service may place a session on, most preferred
 * first, or nothing where sessions are not spread across devices.
 *
 * @param settings - Whether to spread them, the devices as saved and what to do when all are full.
 * @param devices - What the media service found.
 * @returns The placement to send, or null to leave placement off.
 */
const buildPlacement = (
  settings: PlacementSettings,
  devices: readonly TranscodeDevice[],
): Placement | null => {
  if (!settings.spreadAcrossDevices) {
    return null;
  }

  const usable = orderDevices(devices, settings.hardwareDevices)
    .filter((device) => device.isOn)
    .map((device) => ({ id: device.id, maxStreams: device.maxStreams }));

  return usable.length === 0 ? null : { devices: usable, whenFull: settings.whenDevicesFull };
};

export type { PlacementSettings };

export { buildPlacement };
