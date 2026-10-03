type ACalendarDaySheetProps = {
  isOpen: boolean;
  day: string;
  today: string;
  onPick: (day: string) => void;
  onClose: () => void;
};

export type { ACalendarDaySheetProps };
