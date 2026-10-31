import type { AGlyph } from '@ValenceMobile/components/Icon/Icon.types';
import type { ReactNode } from 'react';

type ARoundActionProps = {
  icon?: AGlyph;
  drawn?: ReactNode;
  says: string;
  onPress?: () => void;
  ink?: string;
  isChosen?: boolean;
  isLit?: boolean;
  isDisabled?: boolean;
};

export type { ARoundActionProps };
