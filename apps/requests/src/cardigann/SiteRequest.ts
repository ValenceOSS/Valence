type SiteRequest = {
  url: string;
  method: 'GET' | 'POST';
  body: string | null;
  headers: Readonly<Record<string, string>>;
};

export type { SiteRequest };
