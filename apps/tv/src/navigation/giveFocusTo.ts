import type { View } from 'react-native';

/**
 * Sends the remote to a view, through the television's own focus engine.
 *
 * @param view - Where the remote goes, or nothing to leave it where it is.
 */
const giveFocusTo = (view: Pick<View, 'requestTVFocus'> | null | undefined): void => {
  view?.requestTVFocus();
};

export { giveFocusTo };
