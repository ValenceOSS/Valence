import type { CastableAudio } from './castableAudio.types';

type CastableMusic = CastableAudio & {
  castTheMusic: () => void;
  stopCasting: () => void;
};

export type { CastableMusic };
