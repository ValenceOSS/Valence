/**
 * The address a release's files are downloaded from on GitHub.
 *
 * @param repository - The repository, as `owner/name`.
 * @param tag - The release's tag.
 */
const releaseDownloads = (repository: string, tag: string): string =>
  `https://github.com/${repository}/releases/download/${encodeURIComponent(tag)}`;

export { releaseDownloads };
