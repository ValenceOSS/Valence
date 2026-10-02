import type { HTMLInputAutoCompleteAttribute } from 'react';

type UsernameFieldProps = {
  value: string;
  onValueChange: (value: string) => void;
  userId?: string;
  current?: string | null;
  isOptional?: boolean;
  checksAvailability?: boolean;
  autoComplete?: HTMLInputAutoCompleteAttribute;
  problem?: string;
  descriptionPlacement?: 'above' | 'below';
  className?: string;
};

export type { UsernameFieldProps };
