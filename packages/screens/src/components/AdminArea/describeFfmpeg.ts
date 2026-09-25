import { say } from '@ValenceI18n/say';

const OUR_BUILDS = ['-Valence', '-Flux'];

/**
 * Says which FFmpeg the transcoder is using, in a line a person can quote in a bug report.
 *
 * Reads the banner FFmpeg prints about itself, whose third word is the version, and says whether the
 * build is the one Valence ships. That difference matters: a machine's own FFmpeg keeps working and
 * quietly loses the filters that hold frames on the graphics card, which looks like a slow computer.
 *
 * @param banner - The first line of `ffmpeg -version`, or null where the media service did not say.
 * @returns The line to show, or null where there is nothing worth saying.
 */
const describeFfmpeg = (banner: string | null): string | null => {
  if (banner === null || !banner.startsWith('ffmpeg version')) {
    return null;
  }

  const version = banner.split(/\s+/u)[2];

  if (version === undefined || version === '') {
    return null;
  }

  return OUR_BUILDS.some((name) => banner.includes(name))
    ? say('admin.describeFfmpeg.ours', { version })
    : say('admin.describeFfmpeg.notOurs', { version });
};

export { describeFfmpeg };
