import { setAudioModeAsync } from 'expo-audio';

let isAsked = false;

/**
 * Asks the television to keep playing this app's sound while it is in the background, and not to
 * mix it with another app's, once however many players ask.
 */
const playInTheBackground = (): void => {
  if (isAsked) {
    return;
  }

  isAsked = true;
  void setAudioModeAsync({
    playsInSilentMode: true,
    shouldPlayInBackground: true,
    interruptionMode: 'doNotMix',
  });
};

export { playInTheBackground };
