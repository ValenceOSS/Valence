import type { TranscoderStreamedFile } from '@ValenceServer/transcoder/TranscoderClient';
import type { PlaylistService } from '@ValenceServer/playlists/PlaylistService';
import type { MusicDevices } from './createMusicDevices';
import type { MusicService, TrackFile } from './MusicService';
import type { Rendition } from './renditionFor';

type MusicServices = {
  library: MusicService;
  playlists: PlaylistService;
  devices: MusicDevices;
  stream: (
    file: TrackFile,
    rendition: Rendition,
    range: string | null,
  ) => Promise<TranscoderStreamedFile | null>;
  readImage: (path: string) => Promise<Uint8Array | null>;
};

export type { MusicServices };
