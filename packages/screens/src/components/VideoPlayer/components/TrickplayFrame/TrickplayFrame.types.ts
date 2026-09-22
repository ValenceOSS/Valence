import type { Trickplay } from '@ValenceClient/playback/fetchTrickplay';

type TrickplayFrameProps = {
  trickplay: Trickplay | null;
  seconds: number;
  isFluid?: boolean;
};

export type { TrickplayFrameProps };
