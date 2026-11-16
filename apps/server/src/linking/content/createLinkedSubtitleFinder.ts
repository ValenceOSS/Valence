import { boundedAnswer } from '@ValenceServer/linking/boundedAnswer';
import { RefusalSchema } from '@ValenceContracts/schemas/Refusal';
import {
  FetchedSubtitleSchema,
  FoundSubtitlesSchema,
  SubtitleFindingSchema,
} from '@ValenceContracts/schemas/SubtitleFinding';
import type {
  SubtitleFetch,
  SubtitleFinder,
} from '@ValenceServer/subtitles/finding/SubtitleFinder';
import type { SubtitleFinding } from '@ValenceContracts/schemas/SubtitleFinding';
import type { LinkedAsker } from './createLinkedAsker';
import type { LinkedTitle } from './createLinkedPlayback';

const NOT_ALLOWED = 'error.linking.yourServerMayNotFindSubtitlesHere';

const ANOTHER_EPISODE = 'error.subtitles.thatDownloadIsForAnotherEpisode';

const NOT_KEPT = 'error.subtitles.theSubtitleCouldNotBeKept';

const OUT_OF_REACH_FROM = 500;

/**
 * Reads the code a linked server refused with, where it said one.
 *
 * @param answered - Its answer.
 * @returns The code, or nothing.
 */
const codeOf = async (answered: Response): Promise<string | null> => {
  const read = RefusalSchema.safeParse(
    await boundedAnswer(answered)
      .json()
      .catch(() => null),
  );

  return read.success ? (read.data.code ?? null) : null;
};

/**
 * Finds subtitles for this server's own titles as it always has, and for a linked title by asking
 * the server that has its file, which searches with its own sites and keys, scores what it finds
 * against the file and keeps the one fetched beside it, where every server that plays it finds it.
 * It is asked as whoever is asking here, and only where it lets this server find subtitles.
 *
 * Asked whether subtitles can be found, a linked title says which server it is on, and why not
 * where that server does not let this one, has no subtitle site set up, is too old to know the
 * question, or cannot answer just now — unreachable, failing, or asked too often.
 *
 * @param local - This server's own finder.
 * @param linkedTitleOf - Which linked server a title is from and what it calls it.
 * @param asker - How a linked server is asked.
 * @param serverNameOf - What a linked server is called.
 * @returns The finder.
 */
const createLinkedSubtitleFinder = (
  local: SubtitleFinder,
  linkedTitleOf: (mediaId: string) => Promise<LinkedTitle | null>,
  asker: LinkedAsker,
  serverNameOf: (serverId: string) => Promise<string | null>,
): SubtitleFinder => ({
  ...local,

  finding: async (mediaId) => {
    const linked = await linkedTitleOf(mediaId);

    if (linked === null) {
      return local.finding(mediaId);
    }

    const server = await serverNameOf(linked.serverId);
    const cannot = (state: SubtitleFinding['state']): SubtitleFinding => ({
      state,
      sites: [],
      languages: [],
      server,
    });
    const answered = await asker.ask(
      linked.serverId,
      `/api/media/${linked.remoteId}/subtitles/finding`,
    );

    if (answered?.status === 403) {
      return cannot('notAllowed');
    }

    if (answered?.status === 404) {
      return cannot('notSupported');
    }

    if (answered?.ok !== true) {
      return cannot('unreachable');
    }

    const read = SubtitleFindingSchema.safeParse(
      await boundedAnswer(answered)
        .json()
        .catch(() => null),
    );

    return read.success ? { ...read.data, server } : cannot('notSupported');
  },

  search: async (mediaId, language) => {
    const linked = await linkedTitleOf(mediaId);

    if (linked === null) {
      return local.search(mediaId, language);
    }

    const answered = await asker.ask(
      linked.serverId,
      // oxlint-disable-next-line valence/no-hard-coded-strings -- an address on the server, not words anyone reads
      `/api/media/${linked.remoteId}/subtitles/found?${new URLSearchParams({ language }).toString()}`,
    );

    if (answered?.status === 403 || answered?.status === 404) {
      return null;
    }

    if (answered?.ok !== true) {
      throw new Error(
        `A linked server could not look for subtitles (${String(answered?.status)}).`,
      );
    }

    return FoundSubtitlesSchema.parse(await boundedAnswer(answered).json());
  },

  fetch: async (mediaId, choice): Promise<SubtitleFetch> => {
    const linked = await linkedTitleOf(mediaId);

    if (linked === null) {
      return local.fetch(mediaId, choice);
    }

    const answered = await asker.ask(
      linked.serverId,
      `/api/media/${linked.remoteId}/subtitles/found`,
      {
        method: 'POST',
        headers: new Headers({ 'content-type': 'application/json' }),
        body: new TextEncoder().encode(JSON.stringify(choice)).buffer,
      },
    );

    if (answered === null) {
      return { kind: 'unavailable' };
    }

    if (answered.status >= OUT_OF_REACH_FROM) {
      const code = await codeOf(answered);

      return code === ANOTHER_EPISODE
        ? { kind: 'otherEpisode' }
        : code === NOT_KEPT
          ? { kind: 'failed' }
          : { kind: 'unavailable' };
    }

    if (answered.ok) {
      const read = FetchedSubtitleSchema.safeParse(
        await boundedAnswer(answered)
          .json()
          .catch(() => null),
      );

      return read.success ? { kind: 'fetched', name: read.data.name } : { kind: 'failed' };
    }

    switch (answered.status) {
      case 400:
        return { kind: 'notSetUp' };
      case 403:
        return (await codeOf(answered)) === NOT_ALLOWED
          ? { kind: 'notAllowed' }
          : { kind: 'denied' };
      case 404:
        return { kind: 'absent' };
      default:
        return { kind: 'failed' };
    }
  },
});

export { createLinkedSubtitleFinder };
