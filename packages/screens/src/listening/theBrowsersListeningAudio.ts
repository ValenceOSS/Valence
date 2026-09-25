/**
 * An audio element of its own for a browser window to play audiobooks through, beside the one its
 * music plays through, so a book and a song each keep their place.
 *
 * @returns The element.
 */
const theBrowsersListeningAudio = (): HTMLAudioElement => {
  const audio = new Audio();

  audio.preload = 'auto';

  return audio;
};

export { theBrowsersListeningAudio };
