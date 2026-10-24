import { Badge } from '@ValenceUI/Badge';
import type { TrustBadgeProps } from './TrustBadge.types';
import { say } from '@ValenceI18n/say';

/**
 * Who vouches for a plugin: Valence, a key this server trusts, or nobody.
 *
 * @param trust - Who signed it.
 * @param isAsking - Whether somebody is deciding to install it, which makes a missing signature loud.
 */
const TrustBadge = ({ trust, isAsking = false }: TrustBadgeProps) => (
  <Badge
    size="sm"
    tone={
      trust === 'official'
        ? 'success'
        : trust === 'trusted'
          ? 'accent'
          : isAsking
            ? 'danger'
            : 'warning'
    }
  >
    {trust === 'official'
      ? say('common.official')
      : trust === 'trusted'
        ? say('screens.pluginsPanel.trustBadge.keyYouTrust')
        : say('common.notSigned')}
  </Badge>
);

TrustBadge.displayName = 'TrustBadge';

export { TrustBadge };
