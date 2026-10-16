import type { Bucket } from '@ValenceContracts/schemas/Bucket';

type BucketDialogProps = {
  isOpen: boolean;
  bucket: Bucket | null;
  onClose: () => void;
  onSaved: () => void;
};

export type { BucketDialogProps };
