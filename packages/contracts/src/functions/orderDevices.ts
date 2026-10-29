import type { HardwareDeviceSetting } from '@ValenceContracts/schemas/DevicePlacement';
import type { PlacedDevice, TranscodeDevice } from '@ValenceContracts/schemas/TranscodeDevice';

/**
 * Puts the devices the media service found in the order an administrator prefers them, with
 * whether each is switched on and how many streams it may take; one not yet chosen comes last,
 * on and uncapped, and one chosen but no longer found is left out.
 *
 * @param devices - What the media service found.
 * @param chosen - The devices as saved, most preferred first.
 * @returns Every device found, most preferred first.
 */
const orderDevices = (
  devices: readonly TranscodeDevice[],
  chosen: readonly HardwareDeviceSetting[],
): PlacedDevice[] => {
  const known = chosen.flatMap((setting) => {
    const device = devices.find((one) => one.id === setting.id);

    return device === undefined
      ? []
      : [{ ...device, isOn: setting.isOn, maxStreams: setting.maxStreams }];
  });
  const unchosen = devices
    .filter((device) => !chosen.some((setting) => setting.id === device.id))
    .map((device) => ({ ...device, isOn: true, maxStreams: null }));

  return [...known, ...unchosen].map((device, position) => ({ ...device, position }));
};

export { orderDevices };
