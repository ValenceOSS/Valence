import type { PlacedDevice } from '@ValenceContracts/schemas/TranscodeDevice';

/**
 * Whether streams are being spread across graphics devices, so the load of each is worth showing:
 * more than one is encoding now, or spreading is switched on with more than one to spread across.
 *
 * @param devices - The devices the media service found.
 * @param isSpreadOn - Whether streams are set to be spread across devices.
 * @returns Whether to show each device's load.
 */
const isSpreadingStreams = (devices: readonly PlacedDevice[], isSpreadOn: boolean): boolean =>
  devices.filter((device) => device.streams > 0).length > 1 || (isSpreadOn && devices.length >= 2);

export { isSpreadingStreams };
