import type { ListeningToKeep } from '@ValenceClient/downloads/keptListeningOf';
import type { KeptListeningKind } from '@ValenceContracts/schemas/KeptListening';
import type { AudioQuality, MusicTrack } from '@ValenceContracts/schemas/Music';

type ADownloadToListenProps = {
  kind: KeptListeningKind;
  id: string;
  title: string;
  tracks: readonly MusicTrack[];
  toKeep: (quality: AudioQuality) => ListeningToKeep;
};

export type { ADownloadToListenProps };
