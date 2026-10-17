import { useRef } from 'react';
import { searchCatalogue } from '@ValenceClient/admin/fetchAdmin';
import { correctMatch, forgetCorrection } from '@ValenceClient/library/fetchLibrary';
import { CatalogueMatchList } from '@ValenceScreens/components/AdminArea/components/CatalogueMatchList/CatalogueMatchList';
import { CorrectionPicker } from '@ValenceScreens/components/AdminArea/components/CorrectionPicker/CorrectionPicker';
import type { CatalogueMatch } from '@ValenceClient/admin/fetchAdmin';
import type { MatchPickerProps } from './MatchPicker.types';
import { say } from '@ValenceI18n/say';

/**
 * Corrects what the catalogue made of a file. Shows what it was matched to, offers a search of the
 * catalogue to find what it should have been, and records the correction so that later scans keep it
 * rather than guessing again from the filename.
 *
 * @param media - The item being corrected, or null when the picker is closed.
 * @param isInShows - Whether it sits in a library of shows, so is an episode whatever the scan has
 *   made of it so far: one not matched yet has no series to say so.
 * @param onClose - Called when it is dismissed.
 * @param onCorrected - Called once a correction is recorded, with the job refetching its details.
 */
const MatchPicker = ({ media, isInShows = false, onClose, onCorrected }: MatchPickerProps) => {
  const isEpisode = isInShows || (media?.seriesTitle !== null && media?.seriesTitle !== undefined);
  const kind = isEpisode ? ('tv' as const) : ('movie' as const);
  const started = useRef<string | null>(null);

  return (
    <CorrectionPicker<CatalogueMatch>
      title={media === null ? null : (media.seriesTitle ?? media.title)}
      detail={
        isEpisode
          ? say('screens.adminArea.matchPicker.choosingHereCorrectsEveryEpisodeOf')
          : say('screens.adminArea.matchPicker.choosingHereCorrectsThisFilmAnd')
      }
      searchLabel={
        isEpisode
          ? say('screens.adminArea.matchPicker.searchForASeries')
          : say('screens.adminArea.matchPicker.searchForAFilm')
      }
      startingQuery={media?.seriesTitle ?? media?.title ?? ''}
      search={(query) => searchCatalogue(query, kind)}
      drawMatches={(matches, busyId, choose) => (
        <CatalogueMatchList matches={matches} busyId={busyId} onChoose={choose} />
      )}
      keyOf={(match) => match.externalId}
      choose={async (match) => {
        if (media === null) {
          return null;
        }

        const outcome = await correctMatch(media.id, match.externalId, match.kind);

        if ('problem' in outcome) {
          return outcome.problem;
        }

        started.current = outcome.jobId;

        return null;
      }}
      forget={async () => {
        if (media === null) {
          return null;
        }

        const outcome = await forgetCorrection(media.id);

        if (outcome === null) {
          return say('common.thatCouldNotBePutBack');
        }

        started.current = outcome.jobId;

        return null;
      }}
      forgetLabel={say('screens.adminArea.matchPicker.forgetTheCorrection')}
      onChanged={() => {
        onCorrected(started.current);
      }}
      onClose={onClose}
    />
  );
};

MatchPicker.displayName = 'MatchPicker';

export { MatchPicker };
