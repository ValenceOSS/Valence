import type { Trickplay } from '@ValenceClient/playback/fetchTrickplay';
import type { MediaSegment } from '@ValenceContracts/schemas/MediaSegment';

type TrickplayPreviewProps = {
  trickplay: Trickplay | null;
  seconds: number;
  segment?: MediaSegment | null;
};

export type { TrickplayPreviewProps };
