import type { MediaRequest, Requester } from '@ValenceContracts/schemas/MediaRequest';

/**
 * Requests with the profile each asker's face is drawn from filled in where the request did not
 * keep one, which is every request made before profiles were kept and every one made by an account
 * rather than a profile. Each account is looked up once however many requests it asked for.
 *
 * @param requests - The requests.
 * @param profileOf - The profile an account's face is drawn from, where it has one.
 * @returns The requests, their askers' profiles filled in.
 */
const withAskerProfiles = async (
  requests: readonly MediaRequest[],
  profileOf: (accountId: string) => Promise<string | null>,
): Promise<MediaRequest[]> => {
  const unknown = [
    ...new Set(
      requests
        .flatMap((request) => [request.requestedBy, ...request.alsoAskedBy])
        .filter((asker) => (asker.profileId ?? null) === null)
        .map((asker) => asker.id),
    ),
  ];
  const found = new Map(
    await Promise.all(unknown.map(async (id) => [id, await profileOf(id)] as const)),
  );
  const filled = (asker: Requester): Requester => {
    const profileId = asker.profileId ?? found.get(asker.id) ?? null;

    return profileId === null ? asker : { ...asker, profileId };
  };

  return requests.map((request) => ({
    ...request,
    requestedBy: filled(request.requestedBy),
    alsoAskedBy: request.alsoAskedBy.map(filled),
  }));
};

export { withAskerProfiles };
