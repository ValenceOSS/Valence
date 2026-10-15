type ActingProfile = {
  id: string;
  name: string;
  isOwner: boolean;
  mayRequest: boolean;
};

type Acting = {
  account: { id: string; name: string; email: string };
  sessionId: string;
  isViaKey: boolean;
  profile: ActingProfile | null;
  mustChoose: boolean;
};

export type { Acting, ActingProfile };
