import { parseArgs } from 'node:util';
import { listSnapshots } from '@ValenceServer/db/listSnapshots';
import { restoreSnapshot } from '@ValenceServer/db/restoreSnapshot';
import { readEnv } from '@ValenceServer/env/Env';

/**
 * Lists the snapshots taken before each upgrade, or puts one back.
 *
 * Migrations only go forward, so this is the way back to an older release once a newer one has
 * changed the database: stop Valence, restore the snapshot from before that upgrade, and start the
 * older image. It ships in the image beside the server for the same reason `Migrate.js` does — the
 * person reading the instruction can only run what is inside the container.
 *
 * Restoring replaces the database as it is now, so anything written since the snapshot is lost.
 */
const run = async (): Promise<void> => {
  const env = readEnv(process.env);
  const { values, positionals } = parseArgs({
    options: { list: { type: 'boolean' }, restore: { type: 'boolean' } },
    allowPositionals: true,
  });
  const names = await listSnapshots({ folder: env.BACKUP_DIR });

  if (names.length === 0) {
    process.stdout.write(`There are no snapshots in ${env.BACKUP_DIR}.\n`);

    return;
  }

  if (values.restore !== true) {
    process.stdout.write(
      `Snapshots in ${env.BACKUP_DIR}, newest first:\n${names.map((name) => `  ${name}`).join('\n')}\n\nRestore the newest with \`Rollback.js --restore\`, or one of these with \`Rollback.js --restore <name>\`. Valence must be stopped first, and everything written since that snapshot is lost.\n`,
    );

    return;
  }

  const chosen = positionals[0] ?? names[0];

  if (chosen === undefined || !names.includes(chosen)) {
    throw new Error(`There is no snapshot called ${String(chosen)}. Run with --list to see them.`);
  }

  process.stdout.write(`Restoring ${chosen}...\n`);
  await restoreSnapshot({ databaseUrl: env.DATABASE_URL, folder: env.BACKUP_DIR, name: chosen });
  process.stdout.write(
    'Restored. Start the release that was running when it was taken; starting a newer one applies its migrations again.\n',
  );
};

try {
  await run();
} catch (problem) {
  process.stderr.write(
    `The rollback did not complete: ${problem instanceof Error ? problem.message : 'no reason given'}\n`,
  );
  process.exitCode = 1;
}
