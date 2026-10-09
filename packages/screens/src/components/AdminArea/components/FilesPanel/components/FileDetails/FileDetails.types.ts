import type { LibraryEntry } from '@ValenceContracts/schemas/LibraryFiles';

type FileDetailsProps = {
  where: { name: string; path: string | null; holds: number } | null;
  selected: readonly LibraryEntry[];
  shownPath: (path: string) => string;
  onClear: () => void;
};

export type { FileDetailsProps };
