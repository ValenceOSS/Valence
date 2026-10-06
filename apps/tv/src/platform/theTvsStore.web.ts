import { theBrowsersStore } from '@ValenceClient/platform/theBrowsersStore';
import type { theTvsStore as onTheTelevision } from '@ValenceTv/platform/theTvsStore';

/**
 * Where a television's browser keeps what belongs to it rather than to an account: the browser's
 * own storage, as the web app keeps it.
 *
 * @returns The store, for the platform to be installed with.
 */
const theTvsStore: typeof onTheTelevision = () => theBrowsersStore(() => window.localStorage);

export { theTvsStore };
