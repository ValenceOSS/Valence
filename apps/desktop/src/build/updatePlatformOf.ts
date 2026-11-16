import type { UpdatePlatform } from '@ValenceDesktop/build/UpdatePlatform';

const BUNDLES: { name: RegExp; platforms: Record<string, UpdatePlatform> }[] = [
  {
    name: /^Valence-.+-(?<arch>arm64|x64)\.app\.tar\.gz$/u,
    platforms: { arm64: 'darwin-aarch64', x64: 'darwin-x86_64' },
  },
  {
    name: /^Valence-Setup-.+-(?<arch>x64|arm64)\.exe$/u,
    platforms: { x64: 'windows-x86_64', arm64: 'windows-aarch64' },
  },
  {
    name: /^Valence-.+-(?<arch>x86_64|arm64)\.AppImage$/u,
    platforms: { x86_64: 'linux-x86_64-appimage', arm64: 'linux-aarch64-appimage' },
  },
  {
    name: /^Valence-.+-(?<arch>amd64|arm64)\.deb$/u,
    platforms: { amd64: 'linux-x86_64-deb', arm64: 'linux-aarch64-deb' },
  },
];

/**
 * Which platform's updater installs a file the desktop build hands over, read from its name.
 *
 * @param file - The file's name, as it is published.
 * @returns The platform, or nothing for a file no updater installs, such as a disk image.
 */
const updatePlatformOf = (file: string): UpdatePlatform | undefined =>
  BUNDLES.flatMap(({ name, platforms }) => {
    const arch = name.exec(file)?.groups?.['arch'];

    return arch === undefined ? [] : [platforms[arch]];
  }).find((platform) => platform !== undefined);

export { updatePlatformOf };
