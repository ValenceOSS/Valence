import type { MenuOption } from '@ValenceUI/OptionMenu.types';

type WaitRowProps = {
  title: string;
  description: string;
  choices: MenuOption[];
  value: number | null;
  unit: 'minutes' | 'hours' | 'days';
  onChange: (next: number | null) => void;
};

export type { WaitRowProps };
