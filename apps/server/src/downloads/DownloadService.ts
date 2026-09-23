import type { DeviceProfile } from '@ValenceContracts/schemas/DeviceProfile';
import type { Download, DownloadQuality, Holding } from '@ValenceContracts/schemas/Download';
import type { TranscoderStreamedFile } from '@ValenceServer/transcoder/TranscoderClient';

type DownloadOption = {
  quality: DownloadQuality;
  label: string;
  meaning: string;
  bytes: number | null;
  comparison: string | null;
  wouldTranscode: boolean;
};

type DownloadOffer = {
  mediaId: string;
  title: string;
  episodes: number;
  options: DownloadOption[];
};

type DownloadService = {
  offer: (mediaId: string, deviceProfile: DeviceProfile) => Promise<DownloadOffer | null>;
  offerSeries: (
    seriesId: string,
    deviceProfile: DeviceProfile,
    mediaIds?: readonly string[],
  ) => Promise<DownloadOffer | null>;
  ask: (
    profileId: string,
    mediaId: string,
    quality: DownloadQuality,
    audioLanguages: string[],
  ) => Promise<Download | null>;
  askForSeries: (
    profileId: string,
    seriesId: string,
    quality: DownloadQuality,
    audioLanguages: string[],
    mediaIds?: readonly string[],
  ) => Promise<Download[]>;
  pause: (profileId: string, id: string) => Promise<void>;
  resume: (profileId: string, id: string) => Promise<void>;
  list: (profileId: string) => Promise<Download[]>;
  refresh: (profileId: string) => Promise<Download[]>;
  forget: (profileId: string, id: string) => Promise<void>;
  readFile: (
    profileId: string,
    id: string,
    range: string | null,
  ) => Promise<TranscoderStreamedFile | null>;
  hold: (
    profileId: string,
    clientId: string,
    mediaId: string,
    quality: DownloadQuality,
  ) => Promise<void>;
  release: (
    profileId: string,
    clientId: string,
    mediaId: string,
    quality: DownloadQuality,
  ) => Promise<void>;
  held: (profileId: string) => Promise<Holding[]>;
};

export type { DownloadOffer, DownloadOption, DownloadService };
