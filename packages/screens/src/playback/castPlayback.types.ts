declare global {
  interface HTMLVideoElement {
    webkitShowPlaybackTargetPicker?: () => void;
    webkitCurrentPlaybackTargetIsWireless?: boolean;
  }
}

type CastState = 'unavailable' | 'available' | 'connecting' | 'connected';

type PlaybackTarget = {
  isAvailable: boolean;
  state: 'idle' | 'connecting' | 'connected';
};

export type { CastState, PlaybackTarget };
