import type { SearchScope } from '@ValenceContracts/schemas/MediaRequest';

type SearchButtonsProps = {
  scope: SearchScope;
  onSearch?: ((scope: SearchScope) => void) | undefined;
  onInteractiveSearch?: ((scope: SearchScope) => void) | undefined;
};

export type { SearchButtonsProps };
