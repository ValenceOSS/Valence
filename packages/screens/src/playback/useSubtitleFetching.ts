import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminQueries } from '@ValenceClient/query/adminQueries';
import { keepFoundSubtitle } from '@ValenceClient/library/keepFoundSubtitle';
import { findSubtitles } from '@ValenceClient/library/findSubtitles';
import type { SubtitleTrack } from '@ValenceClient/playback/fetchSubtitles';
import { notify } from '@ValenceUI/notify';
import { say } from '@ValenceI18n/say';
import { languageName } from '@ValenceClient/playback/languageName';

/**
 * The subtitle languages a title could have fetched for it from the sites the server has keys for,
 * leaving out any it already has a track in, and fetching one on request: the best match the sites
 * offer is saved on the server, the title's tracks are read again, and the new one is handed back
 * so it can be switched on.
 *
 * @param mediaId - The title.
 * @param tracks - The tracks it has now.
 * @param isAllowed - Whether the viewer may fetch subtitles at all.
 * @param onFetched - Told the title's tracks after one is fetched, and which of them is new.
 * @returns The languages on offer, the one being fetched, and how to fetch one.
 */
const useSubtitleFetching = (
  mediaId: string,
  tracks: readonly SubtitleTrack[],
  isAllowed: boolean,
  onFetched: (tracks: SubtitleTrack[], fetched: SubtitleTrack) => void,
) => {
  const setup = useQuery({ ...adminQueries.subtitleSetup(), retry: false, enabled: isAllowed });
  const [fetching, setFetching] = useState<string | null>(null);
  const held = new Set(tracks.map((track) => languageName(track.language ?? '').toLowerCase()));
  const offered = !isAllowed
    ? []
    : (setup.data?.languages ?? [])
        .filter((code) => !held.has(languageName(code).toLowerCase()))
        .map((code) => ({ code, label: languageName(code) }));

  const fetchIn = async (code: string) => {
    setFetching(code);

    try {
      const found = await findSubtitles(mediaId, code);
      const best = [...found.subtitles].sort((a, b) => b.score - a.score)[0];

      if (best === undefined) {
        notify.failed(
          say('screens.playback.useSubtitleFetching.noneFound', { language: languageName(code) }),
        );

        return;
      }

      const kept = await keepFoundSubtitle(
        mediaId,
        { source: best.source, id: best.id, language: code },
        tracks,
      );

      if (kept.kind === 'refused') {
        notify.failed(kept.problem);

        return;
      }

      if (kept.fresh !== null) {
        onFetched(kept.tracks, kept.fresh);
      }
    } catch {
      notify.failed(
        say('screens.playback.useSubtitleFetching.couldNotFetch', { language: languageName(code) }),
      );
    } finally {
      setFetching(null);
    }
  };

  return { offered, fetching, fetchIn };
};

export { useSubtitleFetching };
