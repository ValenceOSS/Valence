import type { AGlyph } from '@ValenceMobile/components/Icon/Icon.types';

type ABadgeTone = 'plain' | 'solid' | 'accent' | 'success' | 'busy' | 'danger' | 'quiet';

type ABadgeProps = {
  children: string;
  tone?: ABadgeTone;
  icon?: AGlyph;
  isLarge?: boolean;
};

export type { ABadgeProps, ABadgeTone };
