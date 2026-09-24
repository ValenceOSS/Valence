type UploadSession = {
  uploadId: string;
  libraryId: string;
  path: string;
  destination: string;
  staging: string;
  bytes: number;
  pieceBytes: number;
  pieces: number;
  received: Set<number>;
  touchedAt: number;
};

type UploadSessions = {
  open: (upload: {
    libraryId: string;
    path: string;
    destination: string;
    bytes: number;
  }) => UploadSession;
  find: (uploadId: string, libraryId: string) => UploadSession | null;
  close: (uploadId: string) => void;
  stale: () => UploadSession[];
};

export type { UploadSession, UploadSessions };
