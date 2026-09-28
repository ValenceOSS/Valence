import { formatDuration } from '@ValenceCore/functions/formatDuration';
import { describePicture } from '@ValenceClient/library/describePicture';
import { theVersionsOf } from '@ValenceClient/library/theVersionsOf';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';

type Edition = Pick<
  MediaSummary,
  'id' | 'width' | 'height' | 'videoRange' | 'durationSeconds' | 'versionLabel'
>;

/**
 * The editions of a film or an episode as a chooser lists them: the title itself first, by its own
 * name or as the original, then each other version, each with how sharp and how long it is.
 *
 * @param own - The title itself.
 * @param ownLabel - What the title itself is called as a version, where it is called anything.
 * @param versions - Its other versions.
 * @returns Each edition's id, name, and a line saying what it is.
 */
const editionOptionsOf = (
  own: Edition,
  ownLabel: string | null,
  versions: readonly Edition[],
): { id: string; label: string; detail: string }[] =>
  theVersionsOf(own.id, versions, ownLabel).map((edition) => {
    const file = versions.find((one) => one.id === edition.id) ?? own;

    return {
      id: edition.id,
      label: edition.label,
      detail: [describePicture(file), formatDuration(file.durationSeconds)]
        .filter((part) => part !== null)
        .join(' · '),
    };
  });

export { editionOptionsOf };
