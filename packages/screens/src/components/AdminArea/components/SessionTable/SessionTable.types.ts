import type { ActiveSession } from '@ValenceClient/admin/fetchAdmin';

type SessionRow = {
  id: string;
  session: ActiveSession;
  group: { label: string; count: number } | null;
  parts: SessionRow[];
};

type SessionTableProps = {
  sessions: readonly ActiveSession[];
  busyClientId: string | null;
  onStop: (clientId: string) => void;
  onPause: (clientId: string) => void;
  onResume: (clientId: string) => void;
  onMessage: (session: ActiveSession) => void;
};

export type { SessionRow, SessionTableProps };
