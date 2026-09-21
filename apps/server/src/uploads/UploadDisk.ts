type UploadResult =
  | { kind: 'written'; bytes: number }
  | { kind: 'exists' }
  | { kind: 'readOnly' }
  | { kind: 'denied' }
  | { kind: 'failed' };

type UploadDisk = {
  write: (destination: string, body: ReadableStream<Uint8Array>) => Promise<UploadResult>;
};

export type { UploadDisk, UploadResult };
