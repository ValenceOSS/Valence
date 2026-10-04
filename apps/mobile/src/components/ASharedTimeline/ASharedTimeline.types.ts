type ATimelinePerson = {
  id: string;
  atSeconds: number;
  initial: string;
  label: string;
  isTimekeeper: boolean;
};

type ASharedTimelineProps = {
  label: string;
  durationSeconds: number;
  filledSeconds: number;
  people: readonly ATimelinePerson[];
  elapsed: string;
  total: string;
};

export type { ASharedTimelineProps, ATimelinePerson };
