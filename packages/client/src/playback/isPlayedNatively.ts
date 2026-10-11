import type { DeviceProfile } from '@ValenceContracts/schemas/DeviceProfile';

/**
 * Whether the media element plays a file by itself, as the profile it gave says, so a file sent as
 * it is goes to the element unless only the browser's own player can play it.
 *
 * @param profile - What the media element plays by itself.
 * @param file - The file's container, picture codec and the sound chosen from it.
 * @returns Whether the element plays it.
 */
const isPlayedNatively = (
  profile: DeviceProfile,
  file: { container: string; videoCodec: string; audioCodec: string },
): boolean =>
  profile.directPlayProfiles.some(
    (entry) =>
      entry.container === file.container &&
      entry.videoCodecs.includes(file.videoCodec) &&
      entry.audioCodecs.includes(file.audioCodec),
  );

export { isPlayedNatively };
