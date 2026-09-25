import type { MusicTrack } from '@ValenceContracts/schemas/Music';

type AComingTrackProps = {
  track: MusicTrack;
  at: number;
  onPlay: (at: number) => void;
  onMenu: (at: number, title: string) => void;
};

export type { AComingTrackProps };
