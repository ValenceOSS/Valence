import type { FeedFile } from '@ValenceDesktop/build/FeedFile';

const FIRST = ['x64', 'x86_64'];

/**
 * Whether a file is for the processor electron-updater falls back to when none of a feed's files
 * names its own.
 *
 * @param file - The file.
 */
const isTheFallback = (file: FeedFile): boolean =>
  FIRST.some((arch) => file.url.includes(`-${arch}`));

/**
 * Writes one of the Electron app's update feeds, the YAML electron-updater reads to find a release:
 * its version and, for each file it may install, the file's name beside the feed, its SHA-512 in
 * base64 and its size. An x64 file comes first, being the one an updater that finds none for its
 * own processor takes.
 *
 * @param version - The release's version.
 * @param files - The files the feed offers.
 * @param releasedAt - When the release was made.
 * @returns The feed, as YAML.
 */
const anElectronFeed = (version: string, files: FeedFile[], releasedAt: Date): string => {
  const ordered = [...files].sort(
    (one, other) => Number(isTheFallback(other)) - Number(isTheFallback(one)),
  );
  const first = ordered[0];

  return [
    `version: ${JSON.stringify(version)}`,
    'files:',
    ...ordered.flatMap((file) => [
      `  - url: ${JSON.stringify(file.url)}`,
      `    sha512: ${JSON.stringify(file.sha512)}`,
      `    size: ${file.size.toString()}`,
    ]),
    ...(first === undefined
      ? []
      : [`path: ${JSON.stringify(first.url)}`, `sha512: ${JSON.stringify(first.sha512)}`]),
    `releaseDate: ${JSON.stringify(releasedAt.toISOString())}`,
    '',
  ].join('\n');
};

export { anElectronFeed };
