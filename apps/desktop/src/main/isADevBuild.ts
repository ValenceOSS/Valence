const DEV_VERSION = '-dev';

/**
 * Whether this Valence is a build still being worked on rather than a release: run from source, a
 * test build of a branch (`0.0.0-dev`), or the dev channel built from every merge (`1.4.0-dev.12`).
 *
 * @param isPackaged - Whether it runs from an installed package rather than from source.
 * @param version - The version it was built as.
 * @returns Whether it is one.
 */
const isADevBuild = (isPackaged: boolean, version: string): boolean =>
  !isPackaged || version.includes(DEV_VERSION);

export { isADevBuild };
