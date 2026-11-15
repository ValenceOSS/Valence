import { useOriginOf } from '@ValenceClient/linking/useOriginOf';
import { CARD_ORIGINS } from '@ValenceMobile/components/ACardOrigins/CARD_ORIGINS';
import type { AnOriginHereProps } from './AnOriginHere.types';

/**
 * Works out where a card standing on its own comes from, for a card drawn with no shelf or grid
 * around it to have worked it out once for every card.
 *
 * @param children - The card.
 */
const AnOriginHere = ({ children }: AnOriginHereProps) => (
  <CARD_ORIGINS.Provider value={useOriginOf()}>{children}</CARD_ORIGINS.Provider>
);

AnOriginHere.displayName = 'AnOriginHere';

export { AnOriginHere };
