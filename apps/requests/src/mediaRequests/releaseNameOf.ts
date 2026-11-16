import { parseReleaseName } from '@ValenceCore/releases/parseReleaseName';

/**
 * The release a filed film or episode came from, as subtitle sites name theirs: the name of the
 * video it was filed from, where that reads as a release — saying its source, as a scene name
 * does — and otherwise the title of the release it was fetched as.
 *
 * @param videoName - The name of the downloaded video it was filed from, without its extension.
 * @param releaseTitle - The title of the release it was fetched as.
 * @returns The release, or null where neither is known.
 */
const releaseNameOf = (videoName: string | null, releaseTitle: string | null): string | null => {
  if (videoName === null) {
    return releaseTitle;
  }

  const read = parseReleaseName(videoName);

  return read.source !== null ? videoName : (releaseTitle ?? videoName);
};

export { releaseNameOf };
