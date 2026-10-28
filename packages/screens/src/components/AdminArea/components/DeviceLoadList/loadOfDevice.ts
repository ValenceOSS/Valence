import type { PlacedDevice } from '@ValenceContracts/schemas/TranscodeDevice';

/**
 * How busy one graphics device is, as a percentage: what it reports where it can, or else how
 * many of the streams it was measured to manage it is encoding.
 *
 * @param device - The device.
 * @returns How busy it is, from 0 to 100.
 */
const loadOfDevice = (device: PlacedDevice): number => {
  const share =
    device.busyPercent ?? (device.capacity > 0 ? (device.streams / device.capacity) * 100 : 0);

  return Math.min(100, Math.max(0, share));
};

export { loadOfDevice };
