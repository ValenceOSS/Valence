import { readSessionOnce } from '@ValenceServer/auth/readSessionOnce';
import type { ResolvesSessions } from '@ValenceServer/auth/readSessionOnce';
import type { ChosenProfiles } from '@ValenceServer/profiles/ChosenProfiles';
import type { ProfileService } from '@ValenceServer/profiles/ProfileService';
import type { Acting, ActingProfile } from './Acting';

type ReadsActing = {
  auth: ResolvesSessions;
  profiles?: Pick<ProfileService, 'list' | 'ensureDefault' | 'standingOf'>;
  chosen: ChosenProfiles;
};

const answered = new WeakMap<Headers, Promise<Acting | null>>();

/**
 * Works out, once per request, which account is signed in and which of its profiles is acting: the
 * one the session chose, the one an API key was made for, or the account's only profile where it
 * has just one and no PIN. A session that has not chosen yet acts as nobody in particular and may
 * do nothing until it does, and neither may a key whose profile has been removed. A request counts
 * as a key's only where the session it resolved to is that key's.
 *
 * @param reads - The session, profile and chosen-profile services to ask.
 * @param headers - The request's headers, which also serve as the key for the request.
 * @returns Who is acting, or nothing where nobody is signed in.
 */
const readActing = (reads: ReadsActing, headers: Headers): Promise<Acting | null> => {
  const asked = answered.get(headers);

  if (asked !== undefined) {
    return asked;
  }

  const answering = (async (): Promise<Acting | null> => {
    const session = await readSessionOnce(reads.auth, headers);

    if (session === null) {
      return null;
    }

    const account = { id: session.user.id, name: session.user.name, email: session.user.email };
    const sessionId = session.session.id;
    const key = headers.get('x-api-key');
    const isViaKey = key !== null && key !== '' && session.session.token === key;
    const { profiles } = reads;

    if (profiles === undefined) {
      return { account, sessionId, isViaKey, profile: null, mustChoose: false };
    }

    const standingFor = async (profileId: string | null): Promise<ActingProfile | null> => {
      const standing = profileId === null ? null : await profiles.standingOf(profileId);

      return standing === null || standing.userId !== account.id
        ? null
        : {
            id: standing.id,
            name: standing.name,
            isOwner: standing.isOwner,
            mayRequest: standing.mayRequest,
          };
    };

    if (isViaKey) {
      const tiedTo = await reads.chosen.keyProfileOf(sessionId);
      const profile =
        tiedTo === null && (await profiles.list(account.id)).length === 0
          ? await standingFor((await profiles.ensureDefault(account.id, account.name)).id)
          : await standingFor(tiedTo);

      return { account, sessionId, isViaKey, profile, mustChoose: profile === null };
    }

    const chosen = await standingFor(await reads.chosen.chosenFor(sessionId));

    if (chosen !== null) {
      return { account, sessionId, isViaKey, profile: chosen, mustChoose: false };
    }

    const everyone = await profiles.list(account.id);
    const [only] =
      everyone.length === 0 ? [await profiles.ensureDefault(account.id, account.name)] : everyone;

    if (everyone.length <= 1 && only !== undefined && !only.hasPin) {
      await reads.chosen.choose(sessionId, only.id);

      return {
        account,
        sessionId,
        isViaKey,
        profile: await standingFor(only.id),
        mustChoose: false,
      };
    }

    return { account, sessionId, isViaKey, profile: null, mustChoose: true };
  })();

  answered.set(headers, answering);

  return answering;
};

export type { ReadsActing };

export { readActing };
