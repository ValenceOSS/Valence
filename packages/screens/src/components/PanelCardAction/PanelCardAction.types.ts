import type { ReactNode } from 'react';
import type { IconGlyph } from '@ValenceUI/Icon.types';

type PanelCardActionProps = {
  children: ReactNode;
  icon: IconGlyph;
  onClick: () => void;
  isLoading?: boolean;
  isDisabled?: boolean;
};

export type { PanelCardActionProps };
