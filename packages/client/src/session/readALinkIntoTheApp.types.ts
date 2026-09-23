type ALinkIntoTheApp =
  { kind: 'device'; code: string; server: string | null } | { kind: 'open'; server: string | null };

export type { ALinkIntoTheApp };
