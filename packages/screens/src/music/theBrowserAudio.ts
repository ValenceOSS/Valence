let element: HTMLAudioElement | null = null;

/**
 * The one audio element a browser window plays its music through, made the first time anything
 * asks for it: what a browser or the desktop hands the client's player to play with, and what the
 * visualisers listen to.
 *
 * @returns The element, and whether it can play a kind of file.
 */
const theBrowserAudio = (): {
  audio: HTMLAudioElement;
  canPlay: (type: string) => boolean;
} => {
  const audio = element ?? new Audio();

  if (element === null) {
    audio.preload = 'auto';
    element = audio;
  }

  return { audio, canPlay: (type) => audio.canPlayType(type) !== '' };
};

/**
 * Forgets the window's audio element, so a test starts from nothing.
 */
const forgetTheBrowserAudio = (): void => {
  element = null;
};

export { forgetTheBrowserAudio, theBrowserAudio };
