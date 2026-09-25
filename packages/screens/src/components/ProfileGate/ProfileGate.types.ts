type ProfileGateProps = {
  onSignedIn: () => void;
  name?: string;
  isTelevision?: boolean;
  leadsWithPasskey?: boolean;
  startsAs?: string | null;
};

export type { ProfileGateProps };
