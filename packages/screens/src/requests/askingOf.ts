import type { MediaRequestKind } from '@ValenceContracts/schemas/MediaRequest';

/**
 * How an address names a title to ask about: its kind and the id it goes by, as `film:438631`.
 *
 * @param title - The title's kind and id.
 * @returns What the address carries.
 */
const askingOf = (title: { kind: MediaRequestKind; id: string }): string =>
  `${title.kind}:${title.id}`;

export { askingOf };
