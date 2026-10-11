import { ENGINE_CONTAINERS } from './ENGINE_CONTAINERS';
import type { DeviceProfile } from '@ValenceContracts/schemas/DeviceProfile';
import type { EngineSupport } from './EngineSupport';

/**
 * A device profile that also claims what this browser's own player plays, so the server sends those
 * files as they are rather than converting them. Every container the player reads is claimed with
 * every codec it decodes, beside whatever the media element already claimed for it.
 *
 * @param profile - What the media element plays by itself.
 * @param support - What the browser's own player adds.
 * @returns The profile with both.
 */
const withTheEngine = (profile: DeviceProfile, support: EngineSupport): DeviceProfile => {
  if (support.videoCodecs.length === 0 || support.audioCodecs.length === 0) {
    return profile;
  }

  const claimed = new Map(profile.directPlayProfiles.map((entry) => [entry.container, entry]));

  for (const container of ENGINE_CONTAINERS) {
    const already = claimed.get(container);

    claimed.set(container, {
      container,
      videoCodecs: [...new Set([...(already?.videoCodecs ?? []), ...support.videoCodecs])],
      audioCodecs: [...new Set([...(already?.audioCodecs ?? []), ...support.audioCodecs])],
    });
  }

  return {
    ...profile,
    tenBitVideoCodecs: [...new Set([...profile.tenBitVideoCodecs, ...support.tenBitVideoCodecs])],
    directPlayProfiles: [...claimed.values()],
  };
};

export { withTheEngine };
