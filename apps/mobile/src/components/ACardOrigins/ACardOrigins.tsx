import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useOriginOf } from '@ValenceClient/linking/useOriginOf';
import { libraryQueries } from '@ValenceClient/query/libraryQueries';
import { linkingQueries } from '@ValenceClient/query/linkingQueries';
import { CARD_ORIGINS } from '@ValenceMobile/components/ACardOrigins/CARD_ORIGINS';
import type { ACardOriginsProps } from './ACardOrigins.types';

/**
 * Works out where the cards of a whole shelf or grid come from once, for every card inside it, and
 * hands them the same answer until the libraries or the servers they come from change, so a card is
 * not drawn again only because the row around it was.
 *
 * @param children - The shelf or grid of cards.
 */
const ACardOrigins = ({ children }: ACardOriginsProps) => {
  const originOf = useOriginOf();
  const libraries = useQuery(libraryQueries.all()).data;
  const faces = useQuery(linkingQueries.faces()).data;
  const [answered, setAnswered] = useState({ libraries, faces, originOf });

  if (answered.libraries !== libraries || answered.faces !== faces) {
    setAnswered({ libraries, faces, originOf });
  }

  return <CARD_ORIGINS.Provider value={answered.originOf}>{children}</CARD_ORIGINS.Provider>;
};

ACardOrigins.displayName = 'ACardOrigins';

export { ACardOrigins };
