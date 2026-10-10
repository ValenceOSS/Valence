import type { Ref } from 'react';
import type { View } from 'react-native';
import type { FocusHints, NextFocus } from './FocusHints';

/**
 * Tells the television's focus engine where the remote starts and where pressing right, down or up goes
 * from a pressable element, through the props tvOS and Android TV read for them.
 *
 * @param ref - Handed the element, for whatever sends the remote to it.
 * @param wantsFocus - Whether the remote should start here.
 * @param next - Where pressing right, down and up go, where they should not be left to the television.
 * @returns The ref to hand the element, and the props that say the rest.
 */
const useFocusHints = (
  ref: Ref<View> | undefined,
  wantsFocus: boolean,
  next: NextFocus = {},
): FocusHints => ({
  ref,
  hints: {
    hasTVPreferredFocus: wantsFocus,
    ...(next.right === undefined ? {} : { nextFocusRight: next.right }),
    ...(next.down === undefined ? {} : { nextFocusDown: next.down }),
    ...(next.up === undefined ? {} : { nextFocusUp: next.up }),
  },
});

export { useFocusHints };
