import { useRef } from 'react';
import { useInView } from 'motion/react';
import { useQuery } from '@tanstack/react-query';
import { MediaCard } from '@ValenceUI/MediaCard';
import { requestsQueries } from '@ValenceClient/query/requestsQueries';
import { catalogueIdOfRequest } from '@ValenceClient/requests/catalogueIdOfRequest';
import { askingOf } from '@ValenceScreens/requests/askingOf';
import { statusOfRequest } from '@ValenceScreens/components/RequestsPage/components/OnItsWayShelf/statusOfRequest';
import type { OnItsWayCardProps } from './OnItsWayCard.types';

const NEAR = '0px 50% 0px 50%';

/**
 * One request on its way, in the row of them: an empty card of the right size until it comes near
 * the screen, and only then the request itself over its backdrop — read from the catalogue then, and
 * not before — with who asked for it and where it stands, so a row of thousands costs what the few
 * in view cost.
 *
 * @param request - The request.
 * @param going - How its downloads are going, where any are.
 * @param overlayOf - Draws who asked for it, over the top of its artwork.
 * @param onAsk - Called with the title to open, as its address names it.
 */
const OnItsWayCard = ({ request, going, overlayOf, onAsk }: OnItsWayCardProps) => {
  const place = useRef<HTMLDivElement>(null);
  const isNear = useInView(place, { once: true, margin: NEAR });
  const described = useQuery({
    ...requestsQueries.askable(request.kind, catalogueIdOfRequest(request) || null),
    enabled: isNear,
  });

  if (!isNear) {
    return (
      <div ref={place} aria-hidden className="flex flex-col gap-3">
        <span className="block aspect-video w-full rounded-md bg-surface-raised" />
        <span className="block h-10" />
      </div>
    );
  }

  const backdropUrl = described.data?.backdropUrl ?? request.posterUrl;
  const logoUrl = described.data?.logoUrl ?? null;
  const overlay = overlayOf(request);

  return (
    <div ref={place}>
      <MediaCard
        title={request.title}
        subtitle={request.year?.toString() ?? ''}
        shape="wide"
        {...(backdropUrl === null ? {} : { imageUrl: backdropUrl })}
        {...(logoUrl === null ? {} : { logoUrl })}
        status={statusOfRequest(request, going)}
        {...(overlay === null ? {} : { overlay })}
        onSelect={() => {
          onAsk(askingOf({ kind: request.kind, id: catalogueIdOfRequest(request) }));
        }}
      />
    </div>
  );
};

OnItsWayCard.displayName = 'OnItsWayCard';

export { OnItsWayCard };
