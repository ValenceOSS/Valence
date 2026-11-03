type SiteSession = {
  cookies: Record<string, string>;
  userAgent: string | null;
  browserId?: string;
};

export type { SiteSession };
