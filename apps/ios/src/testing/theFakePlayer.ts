type FakePlayer = {
  play: () => void;
  pause: () => void;
  playing: boolean;
  currentTime: number;
  duration: number;
  source: string | null;
};

const theFakePlayer: FakePlayer = {
  play: () => undefined,
  pause: () => undefined,
  playing: true,
  currentTime: 0,
  duration: 0,
  source: null,
};

/**
 * Puts the one fake player back how it starts, since every test shares it.
 */
const forgetTheFakePlayer = (): void => {
  theFakePlayer.playing = true;
  theFakePlayer.currentTime = 0;
  theFakePlayer.duration = 0;
  theFakePlayer.source = null;
};

export type { FakePlayer };

export { theFakePlayer, forgetTheFakePlayer };
