import type { ABadgeTone } from '@ValenceMobile/components/ABadge/ABadge.types';
import type { AGlyph } from '@ValenceMobile/components/Icon/Icon.types';

type AnOpenedHeadlineProps = {
  facts: string;
  rating: { certification: string; region: string } | null;
  quality: readonly string[];
  statuses: readonly { label: string; tone?: ABadgeTone; icon?: AGlyph }[];
};

export type { AnOpenedHeadlineProps };
