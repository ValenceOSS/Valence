type PageRequest = {
  url: string;
  method: 'GET' | 'POST';
  body: string | null;
  headers: Record<string, string>;
};

export type { PageRequest };
