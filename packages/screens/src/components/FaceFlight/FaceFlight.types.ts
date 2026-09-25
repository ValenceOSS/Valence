import type { ViewerProfile } from '@ValenceContracts/schemas/ViewerProfile';

type FaceLeaving = {
  profile: ViewerProfile;
  at: { x: number; y: number; width: number; height: number };
};

type FaceFlightProps = FaceLeaving & {
  onLanded: () => void;
};

export type { FaceFlightProps, FaceLeaving };
