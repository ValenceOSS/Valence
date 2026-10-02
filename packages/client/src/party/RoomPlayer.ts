type RoomPlayer = {
  readyState: () => number;
  currentSeconds: () => number;
  frameSkewSeconds: () => number;
  bufferedAheadSeconds: () => number;
  isPaused: () => boolean;
  isSeeking: () => boolean;
  seekTo: (seconds: number) => void;
  play: () => Promise<void>;
  pause: () => void;
  setRate: (rate: number) => void;
};

export type { RoomPlayer };
