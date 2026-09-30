import type { DatabaseTls } from './DatabaseTls';

type DatabaseConnection = {
  poolMax: number;
  tls: DatabaseTls;
};

export type { DatabaseConnection };
