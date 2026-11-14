import { Link as LinkIcon } from '@keyline-icons/react/fill';
import { Badge } from '@ValenceUI/Badge';
import { wordsOfOrigin } from '@ValenceScreens/admin/wordsOfOrigin';
import type { OriginBadgeProps } from './OriginBadge.types';

/**
 * A quiet badge saying where a library file came from, with a link drawn on it where the file
 * shares its data with a download still on the disk.
 *
 * @param origin - Where it came from.
 */
const OriginBadge = ({ origin }: OriginBadgeProps) => (
  <Badge size="sm" tone="quiet" {...(origin.link === 'linked' ? { icon: LinkIcon } : {})}>
    {wordsOfOrigin(origin)}
  </Badge>
);

OriginBadge.displayName = 'OriginBadge';

export { OriginBadge };
