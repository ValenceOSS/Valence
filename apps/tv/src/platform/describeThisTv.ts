import { say } from '@ValenceI18n/say';
import { isAnEmulator } from '@ValenceTv/platform/isAnEmulator';
import { theKindOfTv } from '@ValenceTv/platform/theKindOfTv';

/**
 * What to call this television in the sessions list an operator reads.
 *
 * The name somebody gave the box in its settings is the one they will recognise — "Living Room" —
 * and the kind of box stands in where it has none. An Android emulator is called one, since the name
 * it gives itself is its build's, which says nothing to anybody.
 *
 * @param deviceName - What the television calls itself, where the system will say.
 * @param isEmulated - Whether it is an emulator, this television's own answer unless a test says
 *   otherwise.
 * @returns The television as a person would describe it.
 */
const describeThisTv = (
  deviceName: string | null,
  isEmulated: boolean = isAnEmulator(),
): string => {
  if (isEmulated) {
    return say('tv.platform.describeThisTv.androidTvEmulator');
  }

  return deviceName !== null && deviceName.trim() !== '' ? deviceName.trim() : theKindOfTv();
};

export { describeThisTv };
