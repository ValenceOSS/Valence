import { accelerationOptions } from '@ValenceScreens/components/AdminArea/accelerationOptions';

/**
 * Names a hardware backend the way the hardware acceleration setting does.
 *
 * @param accel - The backend, as the media service names it, such as `nvenc`.
 * @returns What to call it, or the identifier in capitals where it has no name.
 */
const nameOfAccel = (accel: string): string =>
  accelerationOptions.find((option) => option.id === accel)?.label ?? accel.toUpperCase();

export { nameOfAccel };
