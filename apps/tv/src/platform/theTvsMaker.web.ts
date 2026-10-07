import { tvMakerOf } from '@ValenceCore/functions/tvMakerOf';
import type { theTvsMaker as onTheTelevision } from '@ValenceTv/platform/theTvsMaker';

/**
 * Who made the television whose browser this is, where the browser says.
 *
 * @returns The maker, or nothing where it does not say.
 */
const theTvsMaker: typeof onTheTelevision = () => tvMakerOf(window.navigator.userAgent);

export { theTvsMaker };
