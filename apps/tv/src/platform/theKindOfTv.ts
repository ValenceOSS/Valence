import { say } from '@ValenceI18n/say';
import { whichTv } from '@ValenceTv/native/whichTv';
import { theTvsMaker } from '@ValenceTv/platform/theTvsMaker';
import type { TvKind } from '@ValenceTv/platform/TvKind';

const NAMES: Record<TvKind, () => string> = {
  appleTv: () => say('common.appleTV'),
  androidTv: () => say('common.androidTV'),
  fireTv: () => say('common.fireTV'),
  lgTv: () => say('common.lgTV'),
  samsungTv: () => say('common.samsungTV'),
  xbox: () => say('common.xbox'),
  smartTv: () => {
    const maker = theTvsMaker();

    return maker === null ? say('common.smartTV') : say('common.makerTV', { maker });
  },
};

/**
 * What kind of television this is, as a person would name the box: an Apple TV, a Fire TV, an
 * Android TV, or an LG, Samsung or other smart TV, or an Xbox, whose browser shows the TV layout.
 * Another maker's television is named after its maker where its browser says who that is.
 *
 * @param kind - Which kind it is, which is this television's own unless a test says otherwise.
 * @returns The kind of television.
 */
const theKindOfTv = (kind: TvKind = whichTv()): string => NAMES[kind]();

export { theKindOfTv };
