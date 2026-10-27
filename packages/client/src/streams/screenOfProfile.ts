import type { DeviceProfile } from '@ValenceContracts/schemas/DeviceProfile';
import type { StreamOffer } from '@ValenceContracts/schemas/StreamOffer';
import type { Screen } from './pickStreamOffer';

const CODECS: Readonly<Record<NonNullable<StreamOffer['codec']>, string | null>> = {
  h264: 'h264',
  h265: 'hevc',
  av1: 'av1',
  h266: null,
  xvid: null,
  mpeg2: null,
};

/**
 * What a device can show and play as it is, read from what it said it plays, for choosing a stream
 * on its behalf.
 *
 * @param profile - What the device plays.
 * @param runtimeMinutes - How long the film runs, where known.
 * @returns The screen to choose for.
 */
const screenOfProfile = (profile: DeviceProfile, runtimeMinutes: number | null): Screen => ({
  maxHeight: profile.maxHeight,
  showsHdr: profile.supportedVideoRanges.some((range) => range !== 'SDR'),
  playsCodec: (codec) => {
    const named = CODECS[codec];

    return (
      named !== null &&
      profile.directPlayProfiles.some((direct) => direct.videoCodecs.includes(named))
    );
  },
  runtimeMinutes,
});

export { screenOfProfile };
