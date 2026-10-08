import { useQuery } from '@tanstack/react-query';
import { sessionQueries } from '@ValenceClient/query/sessionQueries';

type SignInStanding = 'reading' | 'hasPasskey' | 'needsAWayIn' | 'mayAddAPasskey';

/**
 * How the account signed in gets back in: still being asked, it has a passkey already, it has neither a password nor a
 * passkey and so must be given one before it is left, or it has a password and a passkey is only
 * something more. Where the server cannot say, a password is assumed, so nobody is held on a step
 * they cannot leave over a question that went unanswered.
 *
 * @returns Where it stands.
 */
const useSignInStanding = (): SignInStanding => {
  const password = useQuery(sessionQueries.password());
  const passkeys = useQuery(sessionQueries.passkeys());

  if (password.isPending || passkeys.isPending) {
    return 'reading';
  }

  if ((passkeys.data?.length ?? 0) > 0) {
    return 'hasPasskey';
  }

  return password.data === false ? 'needsAWayIn' : 'mayAddAPasskey';
};

export type { SignInStanding };

export { useSignInStanding };
