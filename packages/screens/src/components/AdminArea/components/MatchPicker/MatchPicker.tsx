import { say } from '@ValenceI18n/say';
import { Icon } from '@ValenceUI/Icon';
import { ArrowUTurnLeft as ArrowUTurnLeftIcon, Search as SearchIcon } from '@keyline-icons/react';
import { useEffect, useState } from 'react';
import { Button } from '@ValenceUI/Button';
import { DialogCompanion } from '@ValenceUI/DialogCompanion';
import { DialogContent } from '@ValenceUI/DialogContent';
import { DialogFooter } from '@ValenceUI/DialogFooter';
import { DialogTitle } from '@ValenceUI/DialogTitle';
import { Spinner } from '@ValenceUI/Spinner';
import { notify } from '@ValenceUI/notify';
import { TextField } from '@ValenceUI/TextField';
import { searchCatalogue } from '@ValenceClient/admin/fetchAdmin';
import { correctMatch, forgetCorrection } from '@ValenceClient/library/fetchLibrary';
import { CatalogueMatchList } from '@ValenceScreens/components/AdminArea/components/CatalogueMatchList/CatalogueMatchList';
import type { CatalogueMatch } from '@ValenceClient/admin/fetchAdmin';
import type { MatchPickerProps } from './MatchPicker.types';

/**
 * Corrects what the catalogue made of a file. Shows what it was matched to, offers a search of the
 * catalogue to find what it should have been, and records the correction so that later scans keep it
 * rather than guessing again from the filename.
 *
 * @param media - The item being corrected, or null when the picker is closed.
 * @param onClose - Called when it is dismissed.
 * @param onCorrected - Called once a correction is recorded, with the job refetching its details.
 */
const MatchPicker = ({ media, onClose, onCorrected }: MatchPickerProps) => {
  const isEpisode = media?.seriesTitle !== null && media?.seriesTitle !== undefined;
  const kind = isEpisode ? ('tv' as const) : ('movie' as const);

  const [query, setQuery] = useState('');
  const [matches, setMatches] = useState<CatalogueMatch[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  const [isForgetting, setIsForgetting] = useState(false);

  useEffect(() => {
    if (media === null) {
      return;
    }

    setQuery(media.seriesTitle ?? media.title);
    setMatches(null);
  }, [media]);

  const look = async (asked: string) => {
    setIsSearching(true);

    const found = await searchCatalogue(asked, kind);

    setMatches(found);
    setIsSearching(false);
  };

  const choose = async (match: CatalogueMatch) => {
    if (media === null) {
      return;
    }

    setSaving(match.externalId);

    const outcome = await correctMatch(media.id, match.externalId, match.kind);

    setSaving(null);

    if ('problem' in outcome) {
      notify.failed(outcome.problem);

      return;
    }

    onCorrected(outcome.jobId);
    onClose();
  };

  const forget = async () => {
    if (media === null) {
      return;
    }

    setIsForgetting(true);

    const outcome = await forgetCorrection(media.id);

    setIsForgetting(false);

    if (outcome === null) {
      notify.failed(say('admin.matchPicker.couldNotForget'));

      return;
    }

    notify.worked(say('admin.matchPicker.corrected'));
    onCorrected(outcome.jobId);
    onClose();
  };

  return (
    <DialogCompanion
      label={media?.seriesTitle ?? media?.title ?? say('admin.matchPicker.thisItem')}
      isOpen={media !== null}
      onClose={onClose}
    >
      <DialogTitle
        size="compact"
        title={media?.seriesTitle ?? media?.title ?? say('admin.matchPicker.thisItem')}
        detail={
          isEpisode ? say('admin.matchPicker.seriesDetail') : say('admin.matchPicker.filmDetail')
        }
      />

      <DialogContent className="flex flex-col gap-5">
        <div className="flex flex-wrap items-end gap-3">
          <TextField
            label={
              isEpisode
                ? say('admin.matchPicker.searchSeries')
                : say('admin.matchPicker.searchFilm')
            }
            value={query}
            onValueChange={setQuery}
            className="min-w-0 flex-1"
          />

          <Button
            variant="secondary"
            disabled={query.trim() === ''}
            isLoading={isSearching}
            onClick={() => {
              void look(query);
            }}
          >
            <Icon of={SearchIcon} size={16} />
            {say('admin.matchPicker.search')}
          </Button>
        </div>

        {isSearching ? <Spinner label={say('admin.matchPicker.asking')} size="sm" /> : null}

        {matches === null || isSearching ? null : matches.length === 0 ? (
          <p className="font-body text-sm text-text-muted">{say('admin.matchPicker.noMatches')}</p>
        ) : (
          <CatalogueMatchList
            matches={matches}
            busyId={saving}
            onChoose={(match) => {
              void choose(match);
            }}
          />
        )}
      </DialogContent>

      <DialogFooter dismiss={{ onChoose: onClose }}>
        <Button
          variant="secondary"
          isLoading={isForgetting}
          onClick={() => {
            void forget();
          }}
        >
          <Icon of={ArrowUTurnLeftIcon} size={16} />
          {say('admin.matchPicker.forget')}
        </Button>
      </DialogFooter>
    </DialogCompanion>
  );
};

MatchPicker.displayName = 'MatchPicker';

export { MatchPicker };
