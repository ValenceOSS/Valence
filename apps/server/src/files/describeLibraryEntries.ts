import { basename, dirname, extname } from 'node:path';
import { isMediaFile } from '@ValenceServer/library/isMediaFile';
import { isSidecarName } from '@ValenceServer/library/isSidecarName';
import { isSidecarOf } from '@ValenceServer/library/isSidecarOf';
import { isIgnoredPath } from '@ValenceServer/library/naming/isIgnoredPath';
import type { FileStatus } from '@ValenceContracts/schemas/LibraryFiles';
import type { MediaOrigin } from '@ValenceContracts/schemas/MediaOrigin';
import type { Said } from '@ValenceI18n/SaidSchema';

type ListedEntry = { name: string; path: string; isFolder: boolean };

type HeldFile = {
  id: string;
  rootId: string;
  seriesId: string | null;
  title: string;
  seriesTitle: string | null;
  isMatched: boolean;
  isExtra: boolean;
};

type EntryFacts = {
  media: Readonly<Record<string, HeldFile>>;
  shows: Readonly<Record<string, { seriesId: string; title: string }>>;
  films: Readonly<Record<string, { rootId: string; title: string }>>;
  leftOut: readonly { path: string; isFolder: boolean }[];
  issues: Readonly<Record<string, Said>>;
};

type EntryDescription = {
  mediaId: string | null;
  title: string | null;
  titleId: string | null;
  status: FileStatus | null;
  reason: Said | null;
  belongsTo: string | null;
  origin?: MediaOrigin;
};

const SHOW = 'series';

const SAMPLE = /(?:^|\/)(?:sample|minta)(?:\/|\.|$)|\.(?:sample|minta)\.[^.]+$/iu;

/**
 * Says of each file and folder listed what it is to the library: the title it belongs to, which
 * Media opens; whether it is in the library, matched, an extra, left out, a sample or in a folder
 * scans skip, a video the last scan could not read or has not read yet, or a subtitle, NFO or
 * picture that belongs beside a video, or one whose video is gone, or not a video at all.
 *
 * @param entries - What was listed.
 * @param library - The library they are in.
 * @param facts - What the library holds of them, the programme or the one film each folder holds,
 *   which of them are left out, and what scans said.
 * @returns Each entry's description, by its path.
 */
const describeLibraryEntries = (
  entries: readonly ListedEntry[],
  library: { id: string; path: string },
  facts: EntryFacts,
): Record<string, EntryDescription> => {
  const videos = entries.filter((one) => !one.isFolder && isMediaFile(one.path));
  const isLeftOut = (path: string) =>
    facts.leftOut.some(
      (rule) => rule.path === path || (rule.isFolder && path.startsWith(`${rule.path}/`)),
    );

  return Object.fromEntries(
    entries.map((entry): [string, EntryDescription] => {
      const nothing: EntryDescription = {
        mediaId: null,
        title: null,
        titleId: null,
        status: null,
        reason: null,
        belongsTo: null,
      };

      if (entry.isFolder) {
        const show = facts.shows[entry.path];
        const film = facts.films[entry.path];

        return [
          entry.path,
          {
            ...nothing,
            ...(show !== undefined
              ? { title: show.title, titleId: [SHOW, library.id, show.seriesId].join(' ') }
              : film !== undefined
                ? { title: film.title, titleId: film.rootId }
                : {}),
            status: isLeftOut(entry.path) ? 'leftOut' : null,
          },
        ];
      }

      const held = facts.media[entry.path];

      if (held !== undefined) {
        return [
          entry.path,
          {
            ...nothing,
            mediaId: held.id,
            title: held.seriesTitle ?? held.title,
            titleId:
              held.seriesTitle === null
                ? held.rootId
                : [SHOW, library.id, held.seriesId ?? held.seriesTitle].join(' '),
            status: held.isExtra ? 'extra' : held.isMatched ? 'inLibrary' : 'unmatched',
          },
        ];
      }

      if (isLeftOut(entry.path)) {
        return [entry.path, { ...nothing, status: 'leftOut' }];
      }

      const inLibrary = entry.path.slice(library.path.length);

      if (isMediaFile(entry.path)) {
        const issue = facts.issues[entry.path];

        return [
          entry.path,
          {
            ...nothing,
            status: SAMPLE.test(inLibrary)
              ? 'sample'
              : isIgnoredPath(inLibrary)
                ? 'skipped'
                : issue === undefined
                  ? 'notReadYet'
                  : 'unreadable',
            reason: issue ?? null,
          },
        ];
      }

      if (!isSidecarName(entry.name)) {
        return [entry.path, { ...nothing, status: 'notAVideo' }];
      }

      const video = videos.find(
        (one) =>
          dirname(one.path) === dirname(entry.path) &&
          isSidecarOf(entry.name, basename(one.name, extname(one.name))),
      );

      return [
        entry.path,
        {
          ...nothing,
          status: video === undefined ? 'orphaned' : 'sidecar',
          belongsTo: video?.name ?? null,
        },
      ];
    }),
  );
};

export type { EntryDescription, EntryFacts, HeldFile, ListedEntry };

export { describeLibraryEntries };
