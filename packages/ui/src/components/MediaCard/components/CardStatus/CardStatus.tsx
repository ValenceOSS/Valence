import { Badge } from '@ValenceUI/Badge';
import type { CardStatusProps } from './CardStatus.types';

/**
 * A status laid over a card's artwork, in the tone it is drawn in everywhere else: on a dark,
 * blurred backing and tinted more strongly than inline, so it reads over a bright picture.
 *
 * @param status - What the status says, and its tone.
 */
const CardStatus = ({ status }: CardStatusProps) => (
  <span className="inline-flex overflow-hidden rounded-md bg-overlay backdrop-blur-md">
    <Badge size="md" tone={status.tone} className="bg-current/30 font-semibold">
      {status.label}
    </Badge>
  </span>
);

CardStatus.displayName = 'CardStatus';

export { CardStatus };
