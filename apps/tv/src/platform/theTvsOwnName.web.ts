import type { theTvsOwnName as onTheTelevision } from '@ValenceTv/platform/theTvsOwnName';

/**
 * What a television's browser was named, which it never says. What Expo offers as the device's name
 * in a browser is its guess at the browser from the user agent, and on LG's, which writes Chrome as
 * "Chr0me", that guess is Safari: a television was listed in the sessions as Safari.
 *
 * @returns Nothing, so the television is named by its kind.
 */
const theTvsOwnName: typeof onTheTelevision = () => null;

export { theTvsOwnName };
