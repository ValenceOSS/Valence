import type { UiComponentGroup } from '@ValenceLanding/components/UiLibraryPage/UiLibraryPage.types';

type UiLibrarySidebarProps = {
  groups: readonly UiComponentGroup[];
  selected: string | null;
  query: string;
  onQueryChange: (query: string) => void;
  onChoose?: () => void;
};

export type { UiLibrarySidebarProps };
