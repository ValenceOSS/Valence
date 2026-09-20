import type { WhatIsPlaying } from './useWhatIsPlaying';

/**
 * What the player bar shows when nothing is playing, so its controls can still be drawn — at rest,
 * saying so, and with nothing for them to do.
 *
 * @param volume - The volume the player is set to, which is still the listener's to change.
 * @returns A reading of nothing playing.
 */
const idleWhatIsPlaying = (volume: number): WhatIsPlaying => ({
  trackId: '',
  title: 'Nothing is playing',
  artists: [],
  albumId: '',
  albumTitle: null,
  hasArtwork: false,
  positionSeconds: 0,
  durationSeconds: 0,
  isPlaying: false,
  isLoading: false,
  volume,
  remote: null,
});

export { idleWhatIsPlaying };
