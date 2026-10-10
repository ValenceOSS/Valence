import type { CatalogueEntry } from '@ValenceContracts/schemas/AdminCatalogue';
import type { Library } from '@ValenceContracts/schemas/Library';

type FollowAllDialogProps = {
  isOpen: boolean;
  entries: readonly CatalogueEntry[];
  libraries: readonly Pick<Library, 'id' | 'name' | 'takesRequests'>[];
  onClose: () => void;
  onFollowed: () => void;
};

export type { FollowAllDialogProps };
