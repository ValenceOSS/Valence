import { JsonSchema } from '@ValenceServer/jellyfin/JsonSchema';
import { AuthenticateByNameSchema } from '@ValenceServer/jellyfin/JellyfinRequests';
import { jellyfinIdOf } from '@ValenceServer/jellyfin/jellyfinIdOf';
import { jellyfinSessionOf } from '@ValenceServer/jellyfin/jellyfinSessionOf';
import { jellyfinUserOf } from '@ValenceServer/jellyfin/jellyfinUserOf';
import { lowerKeysDeep } from '@ValenceServer/jellyfin/lowerKeysDeep';
import { splitJellyfinUsername } from '@ValenceServer/jellyfin/splitJellyfinUsername';
import { uuidOfJellyfinId } from '@ValenceServer/jellyfin/uuidOfJellyfinId';
import { refuse } from '@ValenceI18n/refuse';
import type { JellyfinApp } from '@ValenceServer/jellyfin/JellyfinApp';
import type { JellyfinBackend } from '@ValenceServer/jellyfin/JellyfinBackend';

const AVATAR_CACHING = 'private, max-age=3600';

/**
 * Registers signing in and who is signed in. Each Valence profile is a Jellyfin user of its own:
 * an account's email or username signs in as its owner's profile, `name#Profile` as another of
 * its profiles, and an account with a second sign-in step signs in with one of its API keys as the
 * password. A profile with a PIN is refused rather than entered without it.
 *
 * @param jellyfin - The Jellyfin endpoints.
 * @param backend - What they are answered with.
 */
const registerJellyfinUsers = (jellyfin: JellyfinApp, backend: JellyfinBackend): void => {
  jellyfin.post('/users/authenticatebyname', async (context) => {
    const read = JsonSchema.safeParse(await context.req.json().catch(() => null));
    const body = AuthenticateByNameSchema.safeParse(read.success ? lowerKeysDeep(read.data) : null);

    if (!body.success) {
      return context.json(refuse('server.jellyfin.thatNameOrPasswordIsWrong'), 400);
    }

    const { identifier, profileName } = splitJellyfinUsername(body.data.username);
    const answer = await backend.signIn(
      { identifier, profileName, password: body.data.pw ?? body.data.password ?? '' },
      context.get('origin'),
    );

    if (answer.kind === 'refused') {
      return context.json(answer.refusal, answer.status);
    }

    const serverId = await backend.serverId();

    return context.json({
      User: jellyfinUserOf(answer.caller, serverId),
      SessionInfo: jellyfinSessionOf(answer.caller, serverId),
      AccessToken: answer.caller.token,
      ServerId: serverId,
    });
  });

  jellyfin.get('/users/me', async (context) => {
    const caller = context.get('caller');

    return caller === null
      ? context.body(null, 401)
      : context.json(jellyfinUserOf(caller, await backend.serverId()));
  });

  jellyfin.get('/users', async (context) => {
    const caller = context.get('caller');

    return caller === null
      ? context.body(null, 401)
      : context.json([jellyfinUserOf(caller, await backend.serverId())]);
  });

  jellyfin.get('/users/:userId', async (context) => {
    const caller = context.get('caller');

    if (caller === null) {
      return context.body(null, 401);
    }

    return context.req.param('userId').replaceAll('-', '') === jellyfinIdOf(caller.profile.id)
      ? context.json(jellyfinUserOf(caller, await backend.serverId()))
      : context.json(refuse('error.common.noSuchProfile'), 404);
  });

  const avatar = async (profileId: string | undefined) => {
    const uuid = profileId === undefined ? null : uuidOfJellyfinId(profileId);

    return uuid === null ? null : backend.readAvatar(uuid);
  };

  jellyfin.get('/users/:userId/images/:type', async (context) => {
    const image = await avatar(context.req.param('userId'));

    return image === null
      ? context.body(null, 404)
      : context.body(new Uint8Array(image.body), 200, {
          'content-type': image.contentType,
          'cache-control': AVATAR_CACHING,
        });
  });

  jellyfin.get('/userimage', async (context) => {
    const image = await avatar(context.get('query')['userid']);

    return image === null
      ? context.body(null, 404)
      : context.body(new Uint8Array(image.body), 200, {
          'content-type': image.contentType,
          'cache-control': AVATAR_CACHING,
        });
  });

  jellyfin.post('/sessions/logout', async (context) => {
    const caller = context.get('caller');

    if (caller !== null) {
      await backend.signOut(caller);
    }

    return context.body(null, 204);
  });

  jellyfin.post('/sessions/capabilities', (context) => context.body(null, 204));

  jellyfin.post('/sessions/capabilities/full', (context) => context.body(null, 204));

  jellyfin.get('/sessions', async (context) => {
    const caller = context.get('caller');

    return caller === null
      ? context.body(null, 401)
      : context.json([jellyfinSessionOf(caller, await backend.serverId())]);
  });

  jellyfin.get('/displaypreferences/:id', (context) =>
    context.json({
      Id: context.req.param('id'),
      SortBy: 'SortName',
      RememberIndexing: false,
      PrimaryImageHeight: 250,
      PrimaryImageWidth: 250,
      CustomPrefs: {},
      // oxlint-disable-next-line valence/no-hard-coded-strings -- Jellyfin display preference values its apps read, not words for a person
      ScrollDirection: 'Horizontal',
      ShowBackdrop: true,
      RememberSorting: false,
      // oxlint-disable-next-line valence/no-hard-coded-strings -- Jellyfin display preference values its apps read, not words for a person
      SortOrder: 'Ascending',
      ShowSidebar: false,
      Client: context.get('query')['client'] ?? 'emby',
    }),
  );

  jellyfin.post('/displaypreferences/:id', (context) => context.body(null, 204));
};

export { registerJellyfinUsers };
