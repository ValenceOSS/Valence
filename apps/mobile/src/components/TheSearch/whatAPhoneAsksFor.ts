import type { CatalogueBrowseKind } from '@ValenceContracts/schemas/CatalogueTitle';
import type { MediaRequestKind } from '@ValenceContracts/schemas/MediaRequest';

/**
 * Whether a phone asks for this kind of thing, which is films and programmes: music and books wait
 * for players of their own.
 *
 * @param kind - What kind of thing it is.
 * @returns Whether it is a film or a programme.
 */
const whatAPhoneAsksFor = (kind: MediaRequestKind): kind is CatalogueBrowseKind =>
  kind === 'film' || kind === 'series';

export { whatAPhoneAsksFor };
