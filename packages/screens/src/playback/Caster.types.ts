import type { CastDevice } from '@ValenceContracts/schemas/CastingNow';
import type { CastState } from './castPlayback.types';

type CasterSaid = {
  state: CastState;
  devices: CastDevice[] | null;
  deviceId: string | null;
};

type CastHandOver = {
  address: string;
  title: string;
  startSeconds: number;
};

type Caster = {
  watch: (listener: (said: CasterSaid) => void) => () => void;
  canReach: (origin: string) => boolean;
  choose: () => void;
  castTo: (deviceId: string) => Promise<boolean>;
  stop: () => void;
  load: (media: CastHandOver) => Promise<boolean>;
  follow: (
    onSeconds: (seconds: number) => void,
    onPlaying: (isPlaying: boolean) => void,
  ) => () => void;
  playOrPause: () => void;
  seek: (seconds: number) => void;
  setVolume: (level: number) => void;
  deviceName: () => string | null;
  reachableAddress: (address: string) => Promise<string | null>;
};

export type { CastHandOver, Caster, CasterSaid };
