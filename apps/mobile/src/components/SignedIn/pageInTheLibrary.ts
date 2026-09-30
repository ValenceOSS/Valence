import type { CatalogueBrowseKind } from '@ValenceContracts/schemas/CatalogueTitle';
import type { APage } from './SignedIn.types';

/**
 * The page for something already in the library, found from what was asked about: a film's own page,
 * or the programme a series became.
 *
 * @param kind - Whether it was a film or a programme.
 * @param mediaId - What the library holds it as.
 * @returns The page to open.
 */
const pageInTheLibrary = (kind: CatalogueBrowseKind, mediaId: string): APage =>
  kind === 'film' ? { kind: 'title', mediaId } : { kind: 'series', seriesId: mediaId };

export { pageInTheLibrary };
