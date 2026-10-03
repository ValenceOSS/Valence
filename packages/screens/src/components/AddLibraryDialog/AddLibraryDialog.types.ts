import type { Library } from '@ValenceContracts/schemas/Library';

type AddLibraryDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (library: Library) => void;
};

export type { AddLibraryDialogProps };
