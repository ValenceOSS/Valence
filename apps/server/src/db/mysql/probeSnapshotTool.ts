import { runTool } from '@ValenceServer/db/runTool';

/**
 * Says whether a dump tool that takes the database's snapshots is installed beside the server:
 * `mysqldump` for MySQL or `mariadb-dump` for MariaDB.
 *
 * @param run - How to run a tool.
 * @returns Whether either ran, or that neither is installed.
 */
const probeSnapshotTool = async (run: typeof runTool = runTool): Promise<'ran' | 'missing'> => {
  for (const tool of ['mysqldump', 'mariadb-dump']) {
    if ((await run(tool, ['--version']).catch(() => 'missing' as const)) === 'ran') {
      return 'ran';
    }
  }

  return 'missing';
};

export { probeSnapshotTool };
