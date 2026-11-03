import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminQueries } from '@ValenceClient/query/adminQueries';
import { findSubtitles } from '@ValenceClient/library/findSubtitles';
import { keepFoundSubtitle } from '@ValenceClient/library/keepFoundSubtitle';
import { languageName } from '@ValenceClient/playback/languageName';
import { SUBTITLE_LANGUAGES } from '@ValenceContracts/constants/SUBTITLE_LANGUAGES';
import { say } from '@ValenceI18n/say';
import type { Kept } from '@ValenceClient/library/keepFoundSubtitle';
import type { SubtitleTrack } from '@ValenceClient/playback/fetchSubtitles';
import type { FoundSubtitle } from '@ValenceContracts/schemas/SubtitleFinding';

/**
 * A search of the subtitle sites for one film or episode, as a player on the phone or the
 * television offers it: the languages to look in, the server's own first, what was found in the one
 * chosen, best match first, and taking one, which the server fetches and keeps for every app.
 *
 * @param mediaId - The film or episode.
 * @param tracks - The subtitle tracks it has now, so the one fetched can be told apart from them.
 * @param isLooking - Whether the search is open, so nothing is asked of the sites until it is.
 * @returns The languages, the one chosen and how to choose another, what was found, the subtitle
 *   being taken, why the last one could not be, and how to take one.
 */
const useSubtitleSearch = (
  mediaId: string,
  tracks: readonly SubtitleTrack[],
  isLooking: boolean,
) => {
  const setup = useQuery({ ...adminQueries.subtitleSetup(), retry: false, enabled: isLooking });
  const preferred = setup.data?.languages ?? [];
  const [chosen, setChosen] = useState<string | null>(null);
  const [taking, setTaking] = useState<string | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const language = chosen ?? preferred[0] ?? 'en';
  const found = useQuery({
    queryKey: ['subtitles', 'found', mediaId, language],
    queryFn: () => findSubtitles(mediaId, language),
    enabled: isLooking,
    retry: false,
    staleTime: 0,
  });
  const languages = [...new Set([...preferred, ...SUBTITLE_LANGUAGES])].map((code) => ({
    code,
    label: languageName(code),
  }));

  const choose = (code: string) => {
    setChosen(code);
    setProblem(null);
  };

  const take = async (subtitle: FoundSubtitle): Promise<Kept | null> => {
    setTaking(`${subtitle.source}:${subtitle.id}`);
    setProblem(null);

    try {
      const kept = await keepFoundSubtitle(
        mediaId,
        { source: subtitle.source, id: subtitle.id, language },
        tracks,
      );

      if (kept.kind === 'refused') {
        setProblem(kept.problem);
      }

      return kept;
    } catch {
      setProblem(say('common.theServerCouldNotBeReached'));

      return null;
    } finally {
      setTaking(null);
    }
  };

  return { languages, language, choose, found, taking, problem, take };
};

export { useSubtitleSearch };
