type CalendarDayGridProps = {
  month: string;
  picked: string | null;
  today: string;
  counts?: ReadonlyMap<string, number>;
  isArriving?: boolean;
  onPick: (day: string) => void;
};

export type { CalendarDayGridProps };
