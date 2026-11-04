import type { ReactNode } from 'react';
import type { VideoPlayer } from 'expo-video';

type TheClipBehindProps = {
  player: VideoPlayer | null;
  veil: string;
  children: ReactNode;
};

export type { TheClipBehindProps };
