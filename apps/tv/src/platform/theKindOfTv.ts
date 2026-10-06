import { say } from '@ValenceI18n/say';
import { whichTv } from '@ValenceTv/native/whichTv';
import type { TvKind } from '@ValenceTv/platform/TvKind';

/**
 * What kind of television this is, as a person would name the box: an Apple TV, a Fire TV or an
 * Android TV.
 *
 * @param kind - Which kind it is, which is this television's own unless a test says otherwise.
 * @returns The kind of television.
 */
const theKindOfTv = (kind: TvKind = whichTv()): string => {
  if (kind === 'fireTv') {
    return say('common.fireTV');
  }

  return kind === 'androidTv' ? say('common.androidTV') : say('common.appleTV');
};

export { theKindOfTv };
