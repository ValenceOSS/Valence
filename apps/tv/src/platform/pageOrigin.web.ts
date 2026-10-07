import type { pageOrigin as onTheTelevision } from '@ValenceTv/platform/pageOrigin';

/**
 * The origin of the page a television's browser was served, which is the Valence that served it.
 *
 * @returns The origin.
 */
const pageOrigin: typeof onTheTelevision = () => window.location.origin;

export { pageOrigin };
