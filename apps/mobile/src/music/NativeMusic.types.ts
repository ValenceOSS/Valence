type NativeMusic = {
  load: (url: string, cookie: string | null) => void;
  play: () => void;
  pause: () => void;
  seek: (seconds: number) => void;
  setVolume: (volume: number) => void;
  setMuted: (isMuted: boolean) => void;
  describe: (track: {
    title: string;
    artist: string;
    album: string;
    artwork: string | null;
  }) => void;
  stop: () => void;
  addListener: (
    event: 'onAudio' | 'onRemote',
    listener: (said: object) => void,
  ) => { remove: () => void };
};

export type { NativeMusic };
