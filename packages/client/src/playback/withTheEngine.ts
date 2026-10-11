import { ENGINE_CONTAINERS } from './ENGINE_CONTAINERS';
import type { DeviceProfile } from '@ValenceContracts/schemas/DeviceProfile';
import type { EngineSupport } from './EngineSupport';

const TONE_MAPPED_RANGES = ['HDR10', 'HDR10Plus', 'HLG'] as const;

const TALLEST_MPEG2 = 576;

/**
 * Every member of each list once, in the order first met.
 *
 * @param lists - The lists.
 * @returns Their members.
 */
const unionOf = (...lists: readonly (readonly string[])[]): string[] => [...new Set(lists.flat())];

/**
 * A device profile that also claims what this browser can play beyond the media element by itself,
 * so the server sends those files as they are rather than converting them. Every container the
 * browser reads is claimed with every codec it can play from it, beside whatever the element already
 * claimed.
 *
 * An SDR film can be played by the browser's own player or repackaged for the element. An HDR film
 * only by repackaging, where the element shows it as HDR, or by the player where it is a codec it
 * can tone map — and then HDR10, HDR10+ and HLG are claimed too, since the film no longer needs an HDR
 * screen. Dolby Vision is never claimed as such: one with an HDR10 base plays as that base, and one
 * without is left for the server.
 *
 * MPEG-2 is decoded in the page, which keeps up with a DVD's 576 lines but not with HD, so it is
 * only claimed for films no taller than that.
 *
 * @param profile - What the media element plays by itself.
 * @param support - What the browser adds.
 * @param film - Whether the film to be played is HDR, and how tall its picture is.
 * @returns The profile with both.
 */
const withTheEngine = (
  profile: DeviceProfile,
  support: EngineSupport,
  film: { isHdr: boolean; height?: number },
): DeviceProfile => {
  const toneMapped = support.toneMappedCodecs;
  const isTooTallForMpeg2 = (film.height ?? 0) > TALLEST_MPEG2;
  const videoCodecs = (
    film.isHdr
      ? unionOf(support.remuxVideoCodecs, toneMapped)
      : unionOf(support.videoCodecs, support.remuxVideoCodecs)
  ).filter((codec) => codec !== 'mpeg2' || !isTooTallForMpeg2);
  const tenBit = film.isHdr
    ? unionOf(support.remuxTenBitVideoCodecs, toneMapped)
    : unionOf(support.tenBitVideoCodecs, support.remuxTenBitVideoCodecs);

  if (videoCodecs.length === 0 || support.audioCodecs.length === 0) {
    return profile;
  }

  const claimed = new Map(profile.directPlayProfiles.map((entry) => [entry.container, entry]));

  for (const container of ENGINE_CONTAINERS) {
    const already = claimed.get(container);

    claimed.set(container, {
      container,
      videoCodecs: unionOf(already?.videoCodecs ?? [], videoCodecs),
      audioCodecs: unionOf(already?.audioCodecs ?? [], support.audioCodecs),
    });
  }

  return {
    ...profile,
    supportedVideoRanges:
      film.isHdr && support.toneMappedCodecs.length > 0
        ? [...new Set([...profile.supportedVideoRanges, ...TONE_MAPPED_RANGES])]
        : profile.supportedVideoRanges,
    tenBitVideoCodecs: unionOf(profile.tenBitVideoCodecs, tenBit),
    directPlayProfiles: [...claimed.values()],
  };
};

export { withTheEngine };
