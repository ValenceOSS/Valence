import { say } from '@ValenceI18n/say';
import { whichTv } from '@ValenceTv/native/whichTv';
import type { TvKind } from '@ValenceTv/platform/TvKind';

const NAMES: Record<TvKind, () => string> = {
  appleTv: () => say('common.appleTV'),
  androidTv: () => say('common.androidTV'),
  fireTv: () => say('common.fireTV'),
  lgTv: () => say('common.lgTV'),
  samsungTv: () => say('common.samsungTV'),
  smartTv: () => say('common.smartTV'),
};

/**
 * What kind of television this is, as a person would name the box: an Apple TV, a Fire TV, an
 * Android TV, or an LG, Samsung or other smart TV whose browser shows the TV layout.
 *
 * @param kind - Which kind it is, which is this television's own unless a test says otherwise.
 * @returns The kind of television.
 */
const theKindOfTv = (kind: TvKind = whichTv()): string => NAMES[kind]();

export { theKindOfTv };
