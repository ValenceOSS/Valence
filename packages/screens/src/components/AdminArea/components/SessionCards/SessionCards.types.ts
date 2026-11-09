import type { ActiveSession } from '@ValenceClient/admin/fetchAdmin';
import type { MediaGridSize } from '@ValenceScreens/components/MediaGrid/MediaGrid.types';

type SessionCardsProps = {
  sessions: ActiveSession[];
  size?: MediaGridSize;
  busyClientId: string | null;
  onStop: (clientId: string) => void;
  onPause: (clientId: string) => void;
  onResume: (clientId: string) => void;
  onMessage: (session: ActiveSession) => void;
  onSignOut?: (session: ActiveSession) => void;
};

export type { SessionCardsProps };
