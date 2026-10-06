import type { HWEvent } from 'react-native';

const SAME_AS: Record<string, string> = { play: 'playPause', pause: 'playPause' };

/**
 * A button on an Android remote, read the way the Siri Remote would have said it, so a screen hears
 * the same thing from either television.
 *
 * react-native-tvos already tells of an Android remote's presses once, as the key comes up, and of
 * a key held as its held name, as tvOS does. What it leaves is the separate play and pause keys some
 * remotes have, which the Siri Remote has as one button: both are heard as that button.
 *
 * @param event - What Android said.
 * @returns The same, as the Siri Remote would have said it.
 */
const readTheRemote = (event: HWEvent): HWEvent => {
  const eventType = SAME_AS[event.eventType];

  return eventType === undefined ? event : { ...event, eventType };
};

export { readTheRemote };
