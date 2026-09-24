import type { Library } from '@ValenceContracts/schemas/Library';

type UploadStatus = 'waiting' | 'uploading' | 'done' | 'failed';

type QueuedUpload = {
  id: string;
  path: string;
  file: File;
  status: UploadStatus;
  message: string | null;
};

type UploadMediaDialogProps = {
  library: Library | null;
  folder?: string;
  onClose: () => void;
  onUploaded: (library: Library) => void;
};

export type { QueuedUpload, UploadMediaDialogProps, UploadStatus };
