import type { ReactNode } from 'react';

type DayPickerPanelProps = {
  picked: string | null;
  today: string;
  onPick: (day: string) => void;
  footer?: ReactNode;
};

export type { DayPickerPanelProps };
