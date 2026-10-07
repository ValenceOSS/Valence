import type { View } from 'react-native';
import type { giveFocusTo as onTheTelevision } from '@ValenceTv/navigation/giveFocusTo';

/**
 * Sends the remote to a view in a television's browser, by focusing the element it is drawn as.
 *
 * @param view - Where the remote goes, or nothing to leave it where it is.
 */
const giveFocusTo: typeof onTheTelevision = (
  view: Pick<View, 'requestTVFocus'> | null | undefined,
): void => {
  if (view instanceof HTMLElement) {
    view.focus();
  }
};

export { giveFocusTo };
