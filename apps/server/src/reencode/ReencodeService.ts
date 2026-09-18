import type {
  Reencode,
  ReencodeEstimate,
  ReencodeSettings,
  ReencodeStarted,
} from '@ValenceContracts/schemas/Reencode';
import type { Rendition } from '@ValenceContracts/schemas/Rendition';

type ReencodeService = {
  estimate: (mediaIds: string[], settings: ReencodeSettings) => Promise<ReencodeEstimate>;
  start: (
    mediaIds: string[],
    settings: ReencodeSettings,
    askedBy: string | null,
  ) => Promise<ReencodeStarted>;
  list: () => Promise<Reencode[]>;
  cancel: (id: string) => Promise<boolean>;
  confirm: (id: string) => Promise<boolean>;
  reject: (id: string) => Promise<boolean>;
  sample: (id: string) => Promise<boolean>;
  renditionsFor: (mediaId: string) => Promise<Rendition[]>;
  removeRendition: (id: string) => Promise<boolean>;
  work: (
    onProgress: (processed: number, total: number) => void,
    isCancelled: () => boolean,
  ) => Promise<void>;
};

export type { ReencodeService };
