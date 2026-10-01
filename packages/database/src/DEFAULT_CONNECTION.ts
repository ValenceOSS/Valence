import { NO_TLS } from './NO_TLS';
import type { DatabaseConnection } from './DatabaseConnection';

const DEFAULT_CONNECTION: DatabaseConnection = { poolMax: 10, tls: NO_TLS };

export { DEFAULT_CONNECTION };
