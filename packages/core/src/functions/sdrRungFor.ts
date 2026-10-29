import { chooseSource } from '@ValenceCore/functions/chooseSource';
import type { ChooseSourceOptions, ChosenSource } from '@ValenceCore/functions/chooseSource';
import type { DeviceProfile } from '@ValenceContracts/schemas/DeviceProfile';

/**
 * The SDR picture offered beside an HDR one being copied, for a player that cannot show HDR at the
 * moment it starts.
 *
 * A phone that can show HDR stops being able to while its screen is mirrored, recorded, in Low
 * Power Mode or sent by AirPlay to a screen without it, and Apple's player then refuses every HDR
 * picture it is offered. Offered nothing else, it plays nothing: that was an iPhone's "this format
 * isn't supported" on a 4K HDR copy it plays perfectly well unmirrored. Apple's authoring rules ask
 * for an SDR picture beside every HDR one for this, and Jellyfin offers one the same way.
 *
 * It is the same film negotiated for the same device with HDR taken away, which tone maps it into
 * the codec the device converts to. Nothing is offered where the picture is not an HDR copy, or
 * where the conversion would not come out SDR.
 *
 * @param chosen - What the session is playing.
 * @param profile - What the device says it can play.
 * @param asked - The tracks the viewer chose.
 * @returns The rung to offer, or nothing.
 */
const sdrRungFor = (
  chosen: ChosenSource,
  profile: DeviceProfile,
  asked: Pick<
    ChooseSourceOptions,
    'preferredAudioLanguage' | 'chosenSubtitleStreamIndex' | 'subtitleBurnIn'
  >,
): ChosenSource | null => {
  if (chosen.plan.video.kind !== 'passthrough' || chosen.source.item.videoRange === 'SDR') {
    return null;
  }

  const sdr = chooseSource({
    ...asked,
    sources: [chosen.source],
    profile: { ...profile, supportedVideoRanges: ['SDR'] },
    requestedQuality: 'original',
  });

  return sdr !== null && sdr.plan.video.kind === 'transcode' && sdr.plan.video.range === 'SDR'
    ? sdr
    : null;
};

export { sdrRungFor };
