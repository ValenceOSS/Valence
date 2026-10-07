const RELEASES = 'https://github.com/ValenceOSS/valence-ffmpeg/releases/download';

const SUITE = 'bookworm';

const DEBIAN_ARCHITECTURES: Record<string, string> = {
  x64: 'amd64',
  arm64: 'arm64',
};

const MAC_TARGETS: Record<string, string> = {
  arm64: 'macarm64',
  x64: 'mac64',
};

const WINDOWS_TARGETS: Record<string, string> = {
  x64: 'win64',
  arm64: 'winarm64',
};

type FfmpegDownload =
  | { kind: 'tarball'; url: string; fileName: string }
  | { kind: 'zip'; url: string; fileName: string }
  | { kind: 'deb'; url: string; fileName: string }
  | { kind: 'unsupported'; message: string };

type PlanFfmpegDownloadOptions = {
  platform: string;
  arch: string;
  version: string;
};

/**
 * Chooses which release artefact this machine needs, or says why there is not one.
 *
 * macOS takes the portable tarball, Windows the portable zip and Linux the deb, because those are
 * what the fork builds. The asymmetry is not an oversight: neither a Mac nor a Windows PC can use a
 * deb at all, and they are the platforms that most need a build of their own, since neither one's
 * video hardware can be fully reached from inside a container.
 *
 * Both Mac architectures are published. The Intel one is cross-compiled on an Apple silicon runner
 * and was measured on a 2015 MacBook Pro before being offered — the patched VideoToolbox filters
 * run on Iris Pro, which is a generation before Intel had HEVC at all and the oldest thing anybody
 * would reasonably retire into a media server.
 *
 * Both Windows architectures are published too, and Windows on Arm takes its own rather than the x64
 * one under emulation, which would run slower and could not reach the machine's encoder.
 *
 * @param options - What this machine is, and which version is pinned.
 * @returns Where to fetch the artefact, or the reason there is none to fetch.
 */
const planFfmpegDownload = ({
  platform,
  arch,
  version,
}: PlanFfmpegDownloadOptions): FfmpegDownload => {
  if (platform === 'darwin') {
    const target = MAC_TARGETS[arch];

    if (target === undefined) {
      return {
        kind: 'unsupported',
        message: `valence-ffmpeg publishes Apple silicon and Intel for macOS, and this machine is ${arch}.`,
      };
    }

    const fileName = `valence-ffmpeg_${version}_portable_${target}-gpl.tar.xz`;

    return { kind: 'tarball', url: `${RELEASES}/v${version}/${fileName}`, fileName };
  }

  if (platform === 'linux') {
    const debianArch = DEBIAN_ARCHITECTURES[arch];

    if (debianArch === undefined) {
      return {
        kind: 'unsupported',
        message: `valence-ffmpeg publishes amd64 and arm64 for Linux, and this machine is ${arch}.`,
      };
    }

    const fileName = `valence-ffmpeg_${version}-${SUITE}_${debianArch}.deb`;

    return { kind: 'deb', url: `${RELEASES}/v${version}/${fileName}`, fileName };
  }

  if (platform === 'win32') {
    const target = WINDOWS_TARGETS[arch];

    if (target === undefined) {
      return {
        kind: 'unsupported',
        message: `valence-ffmpeg publishes x64 and ARM64 for Windows, and this machine is ${arch}.`,
      };
    }

    const fileName = `valence-ffmpeg_${version}_portable_${target}-clang-gpl.zip`;

    return { kind: 'zip', url: `${RELEASES}/v${version}/${fileName}`, fileName };
  }

  return {
    kind: 'unsupported',
    message: [
      `valence-ffmpeg publishes Linux, macOS and Windows builds, and this machine is ${platform}.`,
      'Run Valence in the container, which carries the build already.',
    ].join('\n'),
  };
};

export type { FfmpegDownload, PlanFfmpegDownloadOptions };

export { planFfmpegDownload, SUITE };
