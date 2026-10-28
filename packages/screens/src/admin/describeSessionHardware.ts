import type { PlaybackHardware } from '@ValenceContracts/schemas/PlaybackHardware';
import { say } from '@ValenceI18n/say';
import { nameOfAccel } from '@ValenceScreens/admin/nameOfAccel';
import { shortDeviceName } from '@ValenceScreens/admin/shortDeviceName';

/**
 * Says which graphics device a stream is encoded on and with what, such as "RTX 5080 · NVENC".
 *
 * @param hardware - The device the media service placed the stream on.
 * @returns The device and the backend, together.
 */
const describeSessionHardware = (hardware: PlaybackHardware): string =>
  say('screens.adminArea.sessionHardware.deviceAccel', {
    device: shortDeviceName(hardware.deviceName),
    accel: nameOfAccel(hardware.accel),
  });

export { describeSessionHardware };
