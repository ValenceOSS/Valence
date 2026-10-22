import type { PlaybackProblem } from '@ValenceContracts/schemas/PlaybackProblem';

const NETWORK = 1;

const MEDIA = 3;

const MANIFEST = 4;

const STREAMING = 5;

const QUOTA_EXCEEDED = 3017;

const ELEMENT_LOST_THE_NETWORK = 2;

const ELEMENT_COULD_NOT_DECODE = 3;

const ELEMENT_COULD_NOT_READ = 4;

type Fault =
  | { from: 'engine'; category: number; code?: number }
  | { from: 'element'; code: number | null }
  | { from: 'picture' };

/**
 * Which playback problem a fault is, once nothing more can be done about it here: a stream that
 * stopped arriving, one the device could not decode, or a picture that stopped while the sound
 * went on. A stream that played for a while before it would not decode had something wrong part of
 * the way in, which is the file rather than the device, so it is called damaged; one that never
 * played is a format the device and the server between them could not manage.
 *
 * @param fault - What the engine or the element reported, or the picture standing still.
 * @param hasPlayed - Whether anything had played before it.
 * @returns The problem, or nothing where the fault is one to reconnect from rather than stop at.
 */
const problemOfAFault = (fault: Fault, hasPlayed: boolean): PlaybackProblem | 'reconnect' => {
  const undecodable = hasPlayed ? 'damaged' : 'unsupported';

  if (fault.from === 'picture') {
    return 'damaged';
  }

  if (fault.from === 'element') {
    return fault.code === ELEMENT_LOST_THE_NETWORK
      ? 'reconnect'
      : fault.code === ELEMENT_COULD_NOT_DECODE || fault.code === ELEMENT_COULD_NOT_READ
        ? undecodable
        : 'unknown';
  }

  if (fault.code === QUOTA_EXCEEDED) {
    return 'streamLost';
  }

  if (fault.category === NETWORK || fault.category === MANIFEST || fault.category === STREAMING) {
    return 'reconnect';
  }

  return fault.category === MEDIA ? undecodable : 'unknown';
};

export type { Fault };

export { problemOfAFault };
