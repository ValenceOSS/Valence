type ACastMember = {
  personId: number | null;
  name: string;
  role: string;
  imageUrl: string | null;
};

type TheCastProps = {
  cast: readonly ACastMember[];
  onLookAtPerson: (personId: number) => void;
};

export type { TheCastProps };
