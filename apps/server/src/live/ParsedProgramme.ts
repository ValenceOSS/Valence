type ParsedProgramme = {
  guideId: string;
  startsAt: Date;
  endsAt: Date;
  title: string;
  subtitle: string | null;
  description: string | null;
  category: string | null;
};

export type { ParsedProgramme };
