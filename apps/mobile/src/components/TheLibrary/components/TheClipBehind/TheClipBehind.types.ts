import type { ReactNode } from 'react';
import type { VideoPlayer } from 'expo-video';

type TheClipBehindProps = {
  player: VideoPlayer | null;
  children: ReactNode;
};

export type { TheClipBehindProps };
