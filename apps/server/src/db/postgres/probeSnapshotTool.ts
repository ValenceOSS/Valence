import { runTool } from '@ValenceServer/db/runTool';

/**
 * Says whether `pg_dump`, which takes the database's snapshots, is installed beside the server.
 *
 * @param run - How to run a tool.
 * @returns Whether it ran, or that it is not installed.
 */
const probeSnapshotTool = (run: typeof runTool = runTool): Promise<'ran' | 'missing'> =>
  run('pg_dump', ['--version']).catch(() => 'missing' as const);

export { probeSnapshotTool };
