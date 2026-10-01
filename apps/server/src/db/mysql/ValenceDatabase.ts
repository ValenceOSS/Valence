import type { createDatabase } from '@ValenceServer/db/mysql/createDatabase';

type ValenceDatabase = ReturnType<typeof createDatabase>['db'];

export type { ValenceDatabase };
