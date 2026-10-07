import { detectFromBrowser } from '@ValenceClient/playback/detectFromBrowser';
import { theKindOfTv } from '@ValenceTv/platform/theKindOfTv';
import type { theTvsProfile as onTheTelevision } from '@ValenceTv/playback/theTvsProfile';

/**
 * What this television's browser plays without help, asked of the browser itself as the web app
 * asks it, since an LG or Samsung browser decodes what the television under it does and no more.
 *
 * @returns The profile.
 */
const theTvsProfile: typeof onTheTelevision = () =>
  detectFromBrowser(window, document.createElement('video'), theKindOfTv());

export { theTvsProfile };
