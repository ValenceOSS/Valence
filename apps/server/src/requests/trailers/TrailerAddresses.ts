type TrailerAddresses = {
  find: (title: string, readYouTubeId: () => Promise<string | null>) => Promise<string | null>;
  forget: (title: string) => void;
  prepare: (
    titles: readonly { title: string; readYouTubeId: () => Promise<string | null> }[],
  ) => void;
};

export type { TrailerAddresses };
