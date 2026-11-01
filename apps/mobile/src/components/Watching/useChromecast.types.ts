import type { QualityPreference } from '@ValenceClient/playback/qualityPreference';

type AChromecastAsk = {
  mediaId: string;
  title: string;
  artwork: string | null;
  clientId: string;
  audioStreamIndex: number | undefined;
  quality: QualityPreference | undefined;
  burnInSubtitleId: string | undefined;
  isKept: boolean;
  startsAt: () => number;
  onTaken: () => void;
  onGivenBack: (atSeconds: number) => void;
  onRefused: () => void;
};

type AChromecast = {
  isCasting: boolean;
  isOffered: boolean;
  deviceName: string | null;
  isPlaying: boolean;
  at: number | null;
  choose: () => void;
  playOrPause: () => void;
  seekTo: (seconds: number) => void;
};

export type { AChromecast, AChromecastAsk };
