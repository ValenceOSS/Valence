import type { AGlyph } from '@ValenceMobile/components/Icon/Icon.types';

type ARemoteChoiceProps = {
  icon: AGlyph;
  label: string;
  value?: string | undefined;
  onPress: () => void;
};

export type { ARemoteChoiceProps };
