import { NAME_MAX } from '@ValenceContracts/schemas/ViewerProfile';
import { faceOfAccount } from './faceOfAccount';
import type { AccountFaces } from './AccountFaces';
import type { HouseholdService } from './HouseholdService';
import type { ProfileService } from '@ValenceServer/profiles/ProfileService';

const NO_PROFILES: Pick<ProfileService, 'list' | 'rename' | 'readAvatar' | 'savePhoto'> = {
  list: () => Promise.resolve([]),
  rename: () => Promise.resolve(false),
  readAvatar: () => Promise.resolve(null),
  savePhoto: () => Promise.resolve('notYours'),
};

/**
 * The face every account shows everybody else, kept in one place: an account one person watches on
 * is that person, read from and written to its one profile, and an account several watch on follows
 * its owner profile for anything it has not chosen for itself.
 *
 * The account and its profiles stay separate underneath, so that a second profile arriving only
 * changes what is offered, never what anybody sees.
 *
 * @param needs - Where accounts and profiles are kept.
 * @param needs.households - What each account chose for itself.
 * @param needs.profiles - Each account's profiles, where this server keeps any.
 * @returns The faces.
 */
const createAccountFaces = ({
  households,
  profiles = NO_PROFILES,
}: {
  households: HouseholdService;
  profiles?: Pick<ProfileService, 'list' | 'rename' | 'readAvatar' | 'savePhoto'> | undefined;
}): AccountFaces => ({
  read: async (accountId, accountName) => {
    const [stored, everyone] = await Promise.all([
      households.read(accountId),
      profiles.list(accountId),
    ]);

    return faceOfAccount({ name: accountName, stored, profiles: everyone });
  },

  readPicture: async (accountId) => {
    const [stored, everyone] = await Promise.all([
      households.read(accountId),
      profiles.list(accountId),
    ]);
    const [owner] = everyone;

    return owner !== undefined && (everyone.length === 1 || stored.avatar === null)
      ? profiles.readAvatar(owner.id)
      : households.readAvatar(accountId);
  },

  change: async (accountId, request) => {
    const everyone = await profiles.list(accountId);
    const [owner] = everyone;

    if (owner === undefined) {
      return (await households.change(accountId, request)) ? 'changed' : 'gone';
    }

    if (everyone.length === 1) {
      if (request.name !== undefined && request.name !== null && request.name.length > NAME_MAX) {
        return 'tooLong';
      }

      const changed = await profiles.rename(accountId, owner.id, {
        name: request.name ?? owner.name,
        colour: request.colour ?? owner.colour,
        ...(request.avatar === undefined || request.avatar === null
          ? {}
          : { avatar: request.avatar }),
      });

      return changed ? 'changed' : 'gone';
    }

    const changed = await households.change(accountId, {
      ...request,
      ...(request.name === owner.name ? { name: null } : {}),
      ...(request.colour === owner.colour ? { colour: null } : {}),
    });

    return changed ? 'changed' : 'gone';
  },

  savePhoto: async (accountId, photo) => {
    const everyone = await profiles.list(accountId);
    const [owner] = everyone;

    if (owner === undefined || everyone.length > 1) {
      return households.savePhoto(accountId, photo);
    }

    const wrong = await profiles.savePhoto(accountId, owner.id, photo);

    if (wrong === null) {
      await profiles.rename(accountId, owner.id, {
        name: owner.name,
        colour: owner.colour,
        avatar: { kind: 'photo', isVideo: photo.contentType.startsWith('video/'), frame: null },
      });
    }

    return wrong;
  },

  forgetOwn: async (accountId) => {
    await households.change(accountId, { name: null, colour: null, avatar: null });
  },
});

export { createAccountFaces };
