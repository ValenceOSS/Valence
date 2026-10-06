import type { nativeTagOf as onTheTelevision } from '@ValenceTv/navigation/nativeTagOf';

/**
 * Nothing, in a television's browser, which has no native views to point at one.
 *
 * @returns Nothing.
 */
const nativeTagOf: typeof onTheTelevision = () => null;

export { nativeTagOf };
