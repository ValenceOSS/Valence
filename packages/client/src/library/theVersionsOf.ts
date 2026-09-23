import type { MediaSummary } from '@ValenceContracts/schemas/Library';

/**
 * The versions of a title somebody can choose between, as every client names them: the title itself
 * as the original, then each other cut by what its filename calls it.
 *
 * @param mediaId - The title itself.
 * @param versions - The other cuts the server holds of it.
 * @returns Each version's id and name, the original first.
 */
const theVersionsOf = (
  mediaId: string,
  versions: readonly Pick<MediaSummary, 'id' | 'versionLabel'>[],
): { id: string; label: string }[] => [
  { id: mediaId, label: 'Original' },
  ...versions.map((one) => ({ id: one.id, label: one.versionLabel ?? 'Another version' })),
];

export { theVersionsOf };
