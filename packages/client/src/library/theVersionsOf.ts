import type { MediaSummary } from '@ValenceContracts/schemas/Library';
import { say } from '@ValenceI18n/say';

/**
 * The versions of a title somebody can choose between, as every client names them: the title itself
 * by its own name where it has one and as the original where it does not, then each other cut by
 * what its filename calls it.
 *
 * @param mediaId - The title itself.
 * @param versions - The other cuts the server holds of it.
 * @param ownLabel - What the title itself is called as a version, where it is called anything.
 * @returns Each version's id and name, the title itself first.
 */
const theVersionsOf = (
  mediaId: string,
  versions: readonly Pick<MediaSummary, 'id' | 'versionLabel'>[],
  ownLabel: string | null = null,
): { id: string; label: string }[] => [
  { id: mediaId, label: ownLabel ?? say('common.original') },
  ...versions.map((one) => ({
    id: one.id,
    label: one.versionLabel ?? say('client.library.theVersionsOf.anotherVersion'),
  })),
];

export { theVersionsOf };
