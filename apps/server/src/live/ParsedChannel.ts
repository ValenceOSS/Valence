type ParsedChannel = {
  number: string | null;
  name: string;
  group: string | null;
  logoUrl: string | null;
  guideId: string | null;
  streamUrl: string;
  userAgent: string | null;
  referrer: string | null;
};

export type { ParsedChannel };
