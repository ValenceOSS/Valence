import type { MediaRequest, Requester } from '@ValenceContracts/schemas/MediaRequest';

/**
 * Requests with the profile each asker's face is drawn from filled in, apart from the quality
 * profile an asker asked at. Each account is looked up once however many requests it asked for.
 *
 * @param requests - The requests.
 * @param profileOf - The profile an account's face is drawn from, where it has one.
 * @returns The requests, their askers' faces filled in.
 */
const withAskerProfiles = async (
  requests: readonly MediaRequest[],
  profileOf: (accountId: string) => Promise<string | null>,
): Promise<MediaRequest[]> => {
  const accounts = [
    ...new Set(
      requests
        .flatMap((request) => [request.requestedBy, ...request.alsoAskedBy])
        .map((asker) => asker.id),
    ),
  ];
  const found = new Map(
    await Promise.all(accounts.map(async (id) => [id, await profileOf(id)] as const)),
  );
  const filled = (asker: Requester): Requester => ({
    ...asker,
    faceProfileId: found.get(asker.id) ?? null,
  });

  return requests.map((request) => ({
    ...request,
    requestedBy: filled(request.requestedBy),
    alsoAskedBy: request.alsoAskedBy.map(filled),
  }));
};

export { withAskerProfiles };
