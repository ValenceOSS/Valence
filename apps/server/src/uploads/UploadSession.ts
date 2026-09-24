type UploadSession = {
  uploadId: string;
  libraryId: string;
  path: string;
  destination: string;
  staging: string;
  bytes: number;
  pieceBytes: number;
  pieces: number;
  received: readonly number[];
  touchedAt: number;
};

type UploadSessions = {
  open: (upload: {
    libraryId: string;
    path: string;
    destination: string;
    bytes: number;
  }) => Promise<UploadSession>;
  find: (uploadId: string, libraryId: string) => Promise<UploadSession | null>;
  receive: (uploadId: string, index: number, isWhole: boolean) => Promise<readonly number[]>;
  close: (uploadId: string) => Promise<void>;
  stale: () => Promise<UploadSession[]>;
};

export type { UploadSession, UploadSessions };
