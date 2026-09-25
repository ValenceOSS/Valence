type PlayingChange = { isPlaying: boolean };

type TimeUpdate = {
  currentTime: number;
  bufferedPosition: number;
  currentLiveTimestamp: null;
  currentOffsetFromLive: null;
};

type WhatAPlayerSays = PlayingChange | TimeUpdate;

type FakePlayer = {
  play: () => void;
  pause: () => void;
  seekBy: (by: number) => void;
  playing: boolean;
  currentTime: number;
  duration: number;
  bufferedPosition: number;
  timeUpdateEventInterval: number;
  showNowPlayingNotification: boolean;
  staysActiveInBackground: boolean;
  source: string | null;
  sentWith: Record<string, string> | null;
  addListener: (of: string, told: (said: WhatAPlayerSays) => void) => { remove: () => void };
  say: (of: string, said: WhatAPlayerSays) => void;
};

const listening = new Map<string, ((said: WhatAPlayerSays) => void)[]>();

const theFakePlayer: FakePlayer = {
  play: () => {
    theFakePlayer.playing = true;
  },
  pause: () => {
    theFakePlayer.playing = false;
  },
  seekBy: (by) => {
    theFakePlayer.currentTime += by;
  },
  playing: true,
  currentTime: 0,
  duration: 0,
  bufferedPosition: 0,
  timeUpdateEventInterval: 0,
  showNowPlayingNotification: false,
  staysActiveInBackground: false,
  source: null,
  sentWith: null,
  addListener: (of, told) => {
    listening.set(of, [...(listening.get(of) ?? []), told]);

    return {
      remove: () => {
        listening.set(
          of,
          (listening.get(of) ?? []).filter((one) => one !== told),
        );
      },
    };
  },
  say: (of, said) => {
    for (const told of listening.get(of) ?? []) {
      told(said);
    }
  },
};

/**
 * Puts the one fake player back how it starts, since every test shares it.
 */
const forgetTheFakePlayer = (): void => {
  listening.clear();
  theFakePlayer.playing = true;
  theFakePlayer.currentTime = 0;
  theFakePlayer.duration = 0;
  theFakePlayer.bufferedPosition = 0;
  theFakePlayer.timeUpdateEventInterval = 0;
  theFakePlayer.showNowPlayingNotification = false;
  theFakePlayer.staysActiveInBackground = false;
  theFakePlayer.source = null;
  theFakePlayer.sentWith = null;
};

export type { FakePlayer, PlayingChange, TimeUpdate, WhatAPlayerSays };

export { theFakePlayer, forgetTheFakePlayer };
