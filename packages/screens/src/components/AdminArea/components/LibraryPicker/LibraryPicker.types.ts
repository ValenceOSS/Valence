import type { Library } from '@ValenceContracts/schemas/Library';

type LibraryPickerProps = {
  libraries: Library[];
  chosen: ReadonlySet<string>;
  onChange: (chosen: ReadonlySet<string>) => void;
};

export type { LibraryPickerProps };
