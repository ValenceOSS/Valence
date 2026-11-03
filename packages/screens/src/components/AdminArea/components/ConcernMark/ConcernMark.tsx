import { Icon } from '@ValenceUI/Icon';
import { cn } from '@ValenceUI/cn';
import { Info as InfoIcon, TriangleAlert as TriangleAlertIcon } from '@keyline-icons/react/fill';
import type { ConcernTone } from '@ValenceScreens/components/AdminArea/collectConcerns';
import type { ConcernMarkProps } from './ConcernMark.types';

const TONE_CLASSES: Record<ConcernTone, string> = {
  broken: 'text-danger',
  attention: 'text-busy',
  setup: 'text-text-muted',
};

/**
 * The mark beside an alert, coloured by how bad it is: red for broken, amber for needing attention,
 * and a muted note for setting up.
 *
 * @param tone - How bad what it marks is.
 * @param className - Extra classes for the caller's own layout.
 */
const ConcernMark = ({ tone, className }: ConcernMarkProps) => (
  <span className={cn('shrink-0', TONE_CLASSES[tone], className)}>
    <Icon of={tone === 'setup' ? InfoIcon : TriangleAlertIcon} size={16} />
  </span>
);

ConcernMark.displayName = 'ConcernMark';

export { ConcernMark };
