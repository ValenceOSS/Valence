import type { ReactNode } from 'react';

type SwitchProps = {
  label: string;
  isLabelHidden?: boolean;
  isLabelWrapped?: boolean;
  isOn: boolean;
  onToggle: () => void;
  icon?: ReactNode;
  disabled?: boolean;
  tone?: 'default' | 'overlay';
  describedBy?: string;
  className?: string;
};

export type { SwitchProps };
