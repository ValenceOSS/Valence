import type { RefusalBody } from '@ValenceI18n/RefusalBody';

type ProfileAnswer<Body> =
  | { kind: 'done'; body: Body }
  | {
      kind: 'refused';
      status: 400 | 401 | 403 | 404 | 409 | 429;
      body: RefusalBody & { needs?: 'pin' | 'newPin' };
    };

export type { ProfileAnswer };
