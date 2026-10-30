import type { ReactNode } from 'react';
import type { AGlyph } from '@ValenceMobile/components/Icon/Icon.types';

type ADetailRowProps = {
  label: string;
  value: string;
  before?: ReactNode;
  icon?: AGlyph;
  onPress?: () => void;
};

export type { ADetailRowProps };
