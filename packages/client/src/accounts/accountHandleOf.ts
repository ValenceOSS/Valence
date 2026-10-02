import { say } from '@ValenceI18n/say';

/**
 * What an account is known by beneath its name: its username, or its address where it has no
 * username, or nothing at all.
 *
 * @param account - Its username and real address, either of which may be missing.
 * @returns The line to show.
 */
const accountHandleOf = (account: {
  username?: string | null | undefined;
  email?: string | null | undefined;
}): string => {
  if (account.username !== undefined && account.username !== null && account.username !== '') {
    return say('common.atUsername', { username: account.username });
  }

  return account.email ?? '';
};

export { accountHandleOf };
