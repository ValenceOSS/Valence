import { tvBrowserOf } from '@ValenceCore/functions/tvBrowserOf';
import type { whichTv as onTheTelevision } from '@ValenceTv/native/whichTv';

/**
 * Whose television this browser belongs to — LG's, Samsung's or another maker's — from what it says
 * it is. The server shows the TV layout only to a television's browser, so one that says nothing of
 * a television is taken for another maker's.
 *
 * @returns The kind of television.
 */
const whichTv: typeof onTheTelevision = () => tvBrowserOf(window.navigator.userAgent) ?? 'smartTv';

export { whichTv };
