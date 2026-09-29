import { bind, setEnabled } from 'cuelume';
import { SOUNDS } from '@ValenceUI/sounds/SOUNDS';

/**
 * Turns the interface's sounds on or off: the ones controls make when pressed, and the ones `cue`
 * plays when something happens. Presses are listened for across the whole document from the first
 * time sounds are turned on, so controls drawn later are heard without asking.
 *
 * @param isOn - Whether to play them.
 */
const switchSounds = (isOn: boolean): void => {
  SOUNDS.isOn = isOn;
  setEnabled(isOn);

  if (isOn) {
    bind();
  }
};

export { switchSounds };
