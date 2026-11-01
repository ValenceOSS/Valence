import type { CastClient } from '@ValenceMobile/music/castAudio.types';
import type { AudioLike } from '@ValenceClient/music/createMusicPlayer';

type CastableAudio = AudioLike & {
  castTo: (client: CastClient, deviceName: string | null) => void;
  bringBack: () => void;
  castingTo: () => string | null;
  subscribe: (listener: () => void) => () => void;
};

export type { CastableAudio };
