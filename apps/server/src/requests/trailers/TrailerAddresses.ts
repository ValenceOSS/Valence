import type { PictureFraming } from './PictureFraming';

type TrailerAddresses = {
  find: (title: string, readYouTubeId: () => Promise<string | null>) => Promise<string | null>;
  forget: (title: string) => void;
  framingOf: (title: string) => PictureFraming | null;
  prepare: (
    titles: readonly { title: string; readYouTubeId: () => Promise<string | null> }[],
  ) => void;
};

export type { TrailerAddresses };
