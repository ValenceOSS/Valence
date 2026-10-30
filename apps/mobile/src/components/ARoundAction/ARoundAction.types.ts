import type { AGlyph } from '@ValenceMobile/components/Icon/Icon.types';

type ARoundActionProps = {
  icon: AGlyph;
  says: string;
  onPress: () => void;
  ink?: string;
  isChosen?: boolean;
  isDisabled?: boolean;
};

export type { ARoundActionProps };
