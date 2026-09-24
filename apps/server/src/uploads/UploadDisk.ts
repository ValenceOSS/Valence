type UploadRefusal = { kind: 'readOnly' } | { kind: 'denied' } | { kind: 'failed' };

type UploadResult = { kind: 'written'; bytes: number } | { kind: 'exists' } | UploadRefusal;

type UploadDisk = {
  write: (destination: string, body: ReadableStream<Uint8Array>) => Promise<UploadResult>;
  begin: (
    destination: string,
    staging: string,
  ) => Promise<{ kind: 'begun' } | { kind: 'exists' } | UploadRefusal>;
  writeAt: (
    staging: string,
    offset: number,
    body: ReadableStream<Uint8Array>,
  ) => Promise<{ kind: 'written'; bytes: number } | UploadRefusal>;
  finish: (staging: string, destination: string, bytes: number) => Promise<UploadResult>;
  discard: (staging: string) => Promise<void>;
};

export type { UploadDisk, UploadRefusal, UploadResult };
