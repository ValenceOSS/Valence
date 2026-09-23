import type { StatusTone } from '@ValenceClient/status/StatusTone';

type StateBadge = {
  label: string;
  tone: StatusTone;
  detail: string | null;
  help?: string | null;
};

export type { StateBadge };
