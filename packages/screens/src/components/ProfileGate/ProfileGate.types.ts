import type { FaceLeaving } from '@ValenceScreens/components/FaceFlight/FaceFlight.types';
type ProfileGateProps = {
  onSignedIn: (face?: FaceLeaving) => void;
  name?: string;
  isTelevision?: boolean;
  leadsWithPasskey?: boolean;
  startsAs?: string | null;
};

export type { ProfileGateProps };
