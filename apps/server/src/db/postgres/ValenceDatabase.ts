import type { createDatabase } from '@ValenceServer/db/postgres/createDatabase';

type ValenceDatabase = ReturnType<typeof createDatabase>['db'];

export type { ValenceDatabase };
