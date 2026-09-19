import type { CatalogueLookup } from '@ValenceServer/requests/catalogue/CatalogueLookup';
import type { DescriptionSources } from '@ValenceServer/requests/catalogue/describeCatalogueTitle';
import type { ShelfSources } from '@ValenceServer/requests/catalogue/discoverShelves';

type Discovery = ShelfSources & DescriptionSources & { lookup: CatalogueLookup };

export type { Discovery };
