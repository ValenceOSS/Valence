import type { ActiveSession } from '@ValenceClient/admin/fetchAdmin';

type SessionTimeProps = {
  session: ActiveSession;
  now?: () => number;
};

export type { SessionTimeProps };
