type TrailerParts = {
  open: () => string;
  addressOf: (token: string, url: string, isPlaylist: boolean) => string;
  urlOf: (token: string, part: string) => string | null;
};

export type { TrailerParts };
