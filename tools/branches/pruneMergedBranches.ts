import { execFileSync } from 'node:child_process';
import { z } from 'zod';
import { findBranchesToPrune } from './findBranchesToPrune';
import type { BranchTip } from './BranchTip';

const PullRequestsSchema = z.array(
  z
    .object({
      headRefName: z.string(),
      headRefOid: z.string(),
      state: z.enum(['OPEN', 'CLOSED', 'MERGED']),
    })
    .transform((request) => ({
      branch: request.headRefName,
      commit: request.headRefOid,
      state: request.state,
    })),
);

/**
 * Runs a command and hands back what it printed.
 *
 * @param command - What to run.
 * @param args - What to run it with.
 */
const run = (command: string, args: readonly string[]): string =>
  execFileSync(command, args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }).trim();

/**
 * Every branch under one kind of ref, with the commit it is at.
 *
 * @param refs - Where to look, such as `refs/heads` or `refs/remotes/origin`.
 * @param depth - How many leading parts of the ref name to drop to leave the branch name.
 */
const tipsUnder = (refs: string, depth: number): BranchTip[] =>
  run('git', ['for-each-ref', refs, `--format=%(refname:lstrip=${depth.toString()}) %(objectname)`])
    .split('\n')
    .filter((line) => line.length > 0)
    .map((line) => {
      const [name = '', commit = ''] = line.split(' ');

      return { name, commit };
    });

/**
 * Lists the branches, here and on GitHub, that a merged pull request has finished with, and takes
 * them away when asked to with `--delete`. Without it, it only says what it would take.
 */
const pruneMergedBranches = (): void => {
  const isDeleting = process.argv.includes('--delete');

  run('git', ['fetch', '--prune', '--quiet', 'origin']);

  const pullRequests = PullRequestsSchema.parse(
    JSON.parse(
      run('gh', [
        'pr',
        'list',
        '--state',
        'all',
        '--limit',
        '5000',
        '--json',
        'headRefName,headRefOid,state',
      ]),
    ),
  );

  const current = run('git', ['rev-parse', '--abbrev-ref', 'HEAD']);
  const remote = findBranchesToPrune(tipsUnder('refs/remotes/origin', 3), pullRequests, current);
  const local = findBranchesToPrune(tipsUnder('refs/heads', 2), pullRequests, current);

  process.stdout.write(
    [
      `On GitHub (${remote.length.toString()}):`,
      ...remote.map((name) => `  ${name}`),
      `Here (${local.length.toString()}):`,
      ...local.map((name) => `  ${name}`),
      '',
    ].join('\n'),
  );

  if (!isDeleting) {
    process.stdout.write('Nothing was deleted. Run again with --delete to take these away.\n');

    return;
  }

  if (remote.length > 0) {
    run('git', ['push', '--no-verify', 'origin', '--delete', ...remote]);
  }

  if (local.length > 0) {
    run('git', ['branch', '-D', ...local]);
  }

  process.stdout.write('Deleted.\n');
};

pruneMergedBranches();
