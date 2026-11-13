type GuardedInit = {
  method?: string | undefined;
  headers?: Record<string, string> | undefined;
  body?: string | undefined;
  redirect?: 'manual' | 'follow' | undefined;
  signal?: AbortSignal | undefined;
};

type GuardedFetch = (url: string, init: GuardedInit) => Promise<Response>;

export type { GuardedFetch, GuardedInit };
