const BY_NAME: Record<string, string> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  Enter: 'select',
  MediaPlayPause: 'playPause',
  MediaPlay: 'playPause',
  MediaPause: 'playPause',
  MediaRewind: 'rewind',
  MediaFastForward: 'fastForward',
  MediaTrackPrevious: 'rewind',
  MediaTrackNext: 'fastForward',
  Escape: 'back',
  Backspace: 'back',
  GoBack: 'back',
  BrowserBack: 'back',
};

const BY_CODE: Record<number, string> = {
  13: 'select',
  8: 'back',
  19: 'playPause',
  412: 'rewind',
  413: 'playPause',
  415: 'playPause',
  417: 'fastForward',
  461: 'back',
  10009: 'back',
  10252: 'playPause',
  179: 'playPause',
};

/**
 * Which of the remote's buttons a key is, named as the Siri Remote's are, for the keys a
 * television's browser sends: by name where it gives one, and by the code LG and Samsung give their
 * remote's buttons where it does not. Hisense's VIDAA and Titan OS send Back as Backspace, so it is
 * Back here; whatever is typing into a field keeps it for itself.
 *
 * @param key - The key's name, as the browser gives it.
 * @param code - The key's code, as the browser gives it.
 * @returns The button, or nothing for a key that is not one of the remote's.
 */
const buttonOfKey = (key: string, code: number): string | null =>
  BY_NAME[key] ?? BY_CODE[code] ?? null;

export { buttonOfKey };
