import { describe, expect, it } from 'vitest';
import { serverProblem } from './serverProblem';

describe('serverProblem', () => {
  it('takes a MySQL or a MariaDB new enough, in the collation each needs', () => {
    expect(
      serverProblem({ version: '8.4.11', collation: 'utf8mb4_0900_bin', database: 'valence' }),
    ).toBeNull();
    expect(
      serverProblem({
        version: '10.6.21-MariaDB-ubu2004',
        collation: 'utf8mb4_nopad_bin',
        database: 'valence',
      }),
    ).toBeNull();
    expect(
      serverProblem({ version: '8.0.21', collation: 'utf8mb4_0900_bin', database: 'valence' }),
    ).toBeNull();
  });

  it('refuses a server older than the queries need', () => {
    expect(
      serverProblem({ version: '8.0.20', collation: 'utf8mb4_0900_bin', database: 'valence' }),
    ).toContain('MySQL 8.0.21 or newer');
    expect(
      serverProblem({
        version: '10.5.27-MariaDB',
        collation: 'utf8mb4_nopad_bin',
        database: 'valence',
      }),
    ).toContain('this server is 10.5.27-MariaDB');
  });

  it('refuses a collation that would take two different names for one, and says how to fix it', () => {
    expect(
      serverProblem({ version: '8.4.11', collation: 'utf8mb4_0900_ai_ci', database: 'valence' }),
    ).toBe(
      'The database valence compares text as utf8mb4_0900_ai_ci, and Valence needs utf8mb4_0900_bin. Before Valence first starts, run: ALTER DATABASE `valence` CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_bin;',
    );
  });

  it('refuses a version it cannot read', () => {
    expect(
      serverProblem({ version: 'unknown', collation: 'utf8mb4_0900_bin', database: 'valence' }),
    ).toContain('MySQL 8.0.21 or newer');
  });
});
