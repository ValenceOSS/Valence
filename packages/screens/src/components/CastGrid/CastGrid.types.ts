type CastMember = {
  personId?: number | null;
  name: string;
  role: string;
  imageUrl: string | null;
};

type CastGridProps = {
  members: CastMember[];
  title?: string;
  onOpenPerson?: (member: CastMember) => void;
};

export type { CastGridProps, CastMember };
