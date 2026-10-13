import type { ABadgeTone } from '@ValenceMobile/components/ABadge/ABadge.types';
import type { AGlyph } from '@ValenceMobile/components/Icon/Icon.types';

type ABadgeRowProps = {
  badges: readonly { label: string; tone?: ABadgeTone; icon?: AGlyph }[];
};

export type { ABadgeRowProps };
