import type { DeviceProfile } from '@ValenceContracts/schemas/DeviceProfile';

/**
 * A client's description of itself, held to the highest bitrate its account may stream at, so the
 * plan made for it never asks for more.
 *
 * @param profile - What the client says it can take.
 * @param maxBitrateKbps - The most its account may stream at, or null where it may stream at any.
 * @returns The profile, lowered where the account's ceiling is lower than the client's own.
 */
const underTheCeiling = (profile: DeviceProfile, maxBitrateKbps: number | null): DeviceProfile =>
  maxBitrateKbps === null
    ? profile
    : {
        ...profile,
        maxBitrateKbps: Math.min(profile.maxBitrateKbps ?? maxBitrateKbps, maxBitrateKbps),
      };

export { underTheCeiling };
