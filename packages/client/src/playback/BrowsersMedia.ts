type BrowsersMedia = {
  MediaSource?: { isTypeSupported: (mimeType: string) => boolean } | undefined;
  navigator: { platform: string };
  screen: { width: number; height: number };
  devicePixelRatio: number;
  matchMedia?: ((query: string) => { matches: boolean }) | undefined;
  AudioContext?:
    | (new () => {
        destination: { maxChannelCount: number };
        close: () => Promise<void>;
      })
    | undefined;
};

export type { BrowsersMedia };
