import type { AGlyph } from '@ValenceMobile/components/Icon/Icon.types';

type AWideButtonProps = {
  icon: AGlyph;
  says: string;
  label: string;
  onPress: () => void;
  isChosen?: boolean;
  isDisabled?: boolean;
};

export type { AWideButtonProps };
