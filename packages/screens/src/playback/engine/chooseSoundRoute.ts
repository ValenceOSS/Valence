import { canEncodeAudio } from 'mediabunny';
import type { InputAudioTrack } from 'mediabunny';

const SURROUND = 6;

const SAMPLE_RATE = 48_000;

const FLAC_TYPE = 'audio/mp4; codecs="flac"';

type SoundRoute =
  | { kind: 'carried'; parameter: string }
  | {
      kind: 'encoded';
      codec: 'flac' | 'opus' | 'aac';
      parameter: string;
      numberOfChannels: number;
      isReordered: boolean;
    };

/**
 * How a sound track reaches the media element: as it is, where the element plays its codec from
 * fragmented MP4, or decoded here and encoded again. Encoding again is lossless FLAC wherever the
 * element takes it — the work happens after the download, so it costs no bandwidth, and FLAC keeps
 * every channel in the order the decoders hand them over, 7.1 included, at the sixteen bits a sample
 * the element accepts FLAC in. Where the element does not
 * take FLAC, 5.1 stays 5.1 as AAC when this browser encodes six channels of it in a known order, and
 * everything else is folded into stereo Opus.
 *
 * @param track - The sound track.
 * @param plays - What the element plays through Media Source Extensions.
 * @param aacOrder - The order this browser's AAC encoder reads six channels in, where known.
 * @returns The route.
 */
const chooseSoundRoute = async (
  track: Pick<InputAudioTrack, 'getCodecParameterString' | 'getNumberOfChannels'>,
  plays: (mimeType: string) => boolean,
  aacOrder: 'wave' | 'aac' | null,
): Promise<SoundRoute> => {
  const own = await track.getCodecParameterString();

  if (own !== null && plays(`audio/mp4; codecs="${own}"`)) {
    return { kind: 'carried', parameter: own };
  }

  const channels = await track.getNumberOfChannels();

  if (plays(FLAC_TYPE) && (await canEncodeAudio('flac', { numberOfChannels: channels }))) {
    return {
      kind: 'encoded',
      codec: 'flac',
      parameter: 'flac',
      numberOfChannels: channels,
      isReordered: false,
    };
  }

  if (
    channels === SURROUND &&
    aacOrder !== null &&
    plays('audio/mp4; codecs="mp4a.40.2"') &&
    (await canEncodeAudio('aac', { numberOfChannels: SURROUND, sampleRate: SAMPLE_RATE }))
  ) {
    return {
      kind: 'encoded',
      codec: 'aac',
      parameter: 'mp4a.40.2',
      numberOfChannels: SURROUND,
      isReordered: aacOrder === 'aac',
    };
  }

  return {
    kind: 'encoded',
    codec: 'opus',
    parameter: 'opus',
    numberOfChannels: 2,
    isReordered: false,
  };
};

export type { SoundRoute };

export { chooseSoundRoute };
