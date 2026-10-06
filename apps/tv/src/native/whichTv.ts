import { Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo';
import type { TvKind } from '@ValenceTv/platform/TvKind';

type ValenceTvKind = { isFireTv: () => boolean };

/**
 * Which kind of television this is: an Apple TV, a Fire TV running Amazon's Fire OS, or any other
 * Android TV. Android says nothing of Amazon, so a Fire TV is told by the module that asks for the
 * feature Amazon gives every one of them.
 *
 * @param system - Which system it runs, which is this television's own unless a test says otherwise.
 * @param kinds - The module that asks Android, which is this television's own unless a test says
 *   otherwise.
 * @returns The kind of television.
 */
const whichTv = (
  system: typeof Platform.OS = Platform.OS,
  kinds: ValenceTvKind | null = requireOptionalNativeModule<ValenceTvKind>('ValenceTvKind'),
): TvKind => {
  if (system !== 'android') {
    return 'appleTv';
  }

  return kinds?.isFireTv() === true ? 'fireTv' : 'androidTv';
};

export { whichTv };
