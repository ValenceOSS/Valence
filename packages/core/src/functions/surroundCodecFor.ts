import type { DeviceProfile } from '@ValenceContracts/schemas/DeviceProfile';

const DOLBY_DIGITAL_PLUS = 'eac3';

const MOST_CHANNELS = 6;

const STEREO = 2;

/**
 * The codec a surround encode is made in for this client, where it asked for Dolby Digital Plus and
 * the encode keeps between three and six channels. Apple's players decode no DTS and want surround
 * in Dolby Digital Plus, which a receiver behind them takes as it is. Stereo stays in the transcoding
 * profile's codec, which sounds better at the bitrates stereo is sent at, and so does anything wider
 * than six channels, since FFmpeg's encoder stops at 5.1 and a 7.1 track would lose two.
 *
 * @param profile - What the device says it can play.
 * @param channels - How many channels the encode keeps.
 * @returns `eac3`, or null where the transcoding profile's codec should be used.
 */
const surroundCodecFor = (profile: DeviceProfile, channels: number): string | null =>
  profile.surroundAudioCodec === DOLBY_DIGITAL_PLUS &&
  channels > STEREO &&
  channels <= MOST_CHANNELS
    ? DOLBY_DIGITAL_PLUS
    : null;

export { surroundCodecFor };
