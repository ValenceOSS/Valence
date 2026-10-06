import type { Ref } from 'react';
import type { View } from 'react-native';
import type { FocusHints } from './FocusHints';

/**
 * Tells the television's focus engine where the remote starts and where pressing right goes from a
 * pressable element, through the props tvOS and Android TV read for both.
 *
 * @param ref - Handed the element, for whatever sends the remote to it.
 * @param wantsFocus - Whether the remote should start here.
 * @param nextFocusRight - Where pressing right goes, where it should not be left to the television.
 * @returns The ref to hand the element, and the props that say the rest.
 */
const useFocusHints = (
  ref: Ref<View> | undefined,
  wantsFocus: boolean,
  nextFocusRight: View | null | undefined,
): FocusHints => ({
  ref,
  hints: {
    hasTVPreferredFocus: wantsFocus,
    ...(nextFocusRight === undefined ? {} : { nextFocusRight }),
  },
});

export { useFocusHints };
