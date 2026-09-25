type Channel = 'music' | 'book';

type NativeMusic = {
  load: (channel: Channel, url: string, cookie: string | null) => void;
  lineUp: (channel: Channel, url: string, cookie: string | null) => void;
  play: (channel: Channel) => void;
  pause: (channel: Channel) => void;
  seek: (channel: Channel, seconds: number) => void;
  setRate: (channel: Channel, rate: number) => void;
  setVolume: (channel: Channel, volume: number) => void;
  setMuted: (channel: Channel, isMuted: boolean) => void;
  describe: (
    channel: Channel,
    track: {
      title: string;
      artist: string;
      album: string;
      artwork: string | null;
      from: number | null;
      lasts: number | null;
    },
  ) => void;
  stop: (channel: Channel) => void;
  addListener: (
    event: 'onAudio' | 'onRemote',
    listener: (said: object) => void,
  ) => { remove: () => void };
};

export type { Channel, NativeMusic };
