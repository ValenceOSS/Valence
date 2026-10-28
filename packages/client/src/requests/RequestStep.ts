import type { RequestLogEntry } from '@ValenceContracts/schemas/MediaRequest';
import type { RequestNow } from '@ValenceContracts/schemas/RequestNow';
import type { RequestStage } from '@ValenceClient/requests/RequestStage';

type RequestStepOutcome = 'done' | 'failed' | 'current' | 'stuck' | 'later' | 'asks' | 'refused';

type RequestStep = {
  id: string;
  stage: RequestStage;
  outcome: RequestStepOutcome;
  lines: readonly RequestLogEntry[];
  startedAt: string | null;
  endedAt: string | null;
  now: RequestNow;
};

export type { RequestStep, RequestStepOutcome };
