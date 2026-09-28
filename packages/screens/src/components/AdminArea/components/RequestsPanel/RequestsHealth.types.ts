import type { BadgeTone } from '@ValenceUI/Badge.types';

type RequestsHealth = {
  label: string;
  tone: BadgeTone;
  detail: string;
  help?: string | null;
};

export type { RequestsHealth };
