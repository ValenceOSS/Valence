import {
  ArrowUTurnLeft as ArrowUTurnLeftIcon,
  Search as SearchIcon,
} from '@keyline-icons/react/fill';
import { useEffect, useState } from 'react';
import { Button } from '@ValenceUI/Button';
import { DialogCompanion } from '@ValenceUI/DialogCompanion';
import { DialogContent } from '@ValenceUI/DialogContent';
import { DialogFooter } from '@ValenceUI/DialogFooter';
import { DialogTitle } from '@ValenceUI/DialogTitle';
import { Icon } from '@ValenceUI/Icon';
import { Spinner } from '@ValenceUI/Spinner';
import { TextField } from '@ValenceUI/TextField';
import { notify } from '@ValenceUI/notify';
import type { CorrectionPickerProps } from './CorrectionPicker.types';
import { say } from '@ValenceI18n/say';

/**
 * Tells an album or a book what it really is: searches a catalogue under its name, which can be
 * changed, offers what came back to choose from, and records the choice so later scans keep it — or
 * forgets an earlier choice, so its files say what it is again from the next scan.
 *
 * @param title - What is being corrected, or nothing while the picker is closed.
 * @param detail - What choosing here changes.
 * @param searchLabel - What the search box asks for.
 * @param startingQuery - What is searched for first.
 * @param search - Searches the catalogue.
 * @param drawMatches - Draws what came back, marking the one being saved and choosing one.
 * @param keyOf - Tells the matches apart.
 * @param choose - Records the choice, answering why it could not where it could not.
 * @param forget - Forgets an earlier choice, answering why it could not where it could not.
 * @param onChanged - Told once something was recorded or forgotten.
 * @param onClose - Told it is dismissed.
 */
const CorrectionPicker = <Match,>({
  title,
  detail,
  searchLabel,
  startingQuery,
  search,
  drawMatches,
  keyOf,
  choose,
  forget,
  onChanged,
  onClose,
}: CorrectionPickerProps<Match>) => {
  const [query, setQuery] = useState('');
  const [matches, setMatches] = useState<Match[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  const [isForgetting, setIsForgetting] = useState(false);

  useEffect(() => {
    if (title === null) {
      return;
    }

    setQuery(startingQuery);
    setMatches(null);
  }, [title, startingQuery]);

  const look = async (asked: string) => {
    setIsSearching(true);
    setMatches(await search(asked));
    setIsSearching(false);
  };

  const chosen = async (match: Match) => {
    setSaving(keyOf(match));

    const problem = await choose(match);

    setSaving(null);

    if (problem !== null) {
      notify.failed(problem);

      return;
    }

    notify.worked(say('common.correctedTheMatch'));
    onChanged();
    onClose();
  };

  const forgotten = async () => {
    setIsForgetting(true);

    const problem = await forget();

    setIsForgetting(false);

    if (problem !== null) {
      notify.failed(problem);

      return;
    }

    notify.worked(say('screens.adminArea.correctionPicker.itWillSayWhatItsFiles'));
    onChanged();
    onClose();
  };

  return (
    <DialogCompanion
      label={title ?? say('common.thisItem')}
      isOpen={title !== null}
      onClose={onClose}
    >
      <DialogTitle size="compact" title={title ?? say('common.thisItem')} detail={detail} />

      <DialogContent className="flex flex-col gap-5">
        <form
          className="flex flex-wrap items-end gap-3"
          onSubmit={(event) => {
            event.preventDefault();

            if (query.trim() !== '') {
              void look(query);
            }
          }}
        >
          <TextField
            label={searchLabel}
            value={query}
            onValueChange={setQuery}
            className="min-w-0 flex-1"
          />

          <Button
            type="submit"
            variant="secondary"
            disabled={query.trim() === ''}
            isLoading={isSearching}
          >
            <Icon of={SearchIcon} size={16} />
            {say('common.search')}
          </Button>
        </form>

        {isSearching ? <Spinner label={say('common.askingTheCatalogue')} size="sm" /> : null}

        {matches === null || isSearching ? null : matches.length === 0 ? (
          <p className="font-body text-sm text-text-muted">
            {say('common.nothingCameBackUnderThatName')}
          </p>
        ) : (
          drawMatches(matches, saving, (match) => {
            void chosen(match);
          })
        )}
      </DialogContent>

      <DialogFooter dismiss={{ onChoose: onClose }}>
        <Button
          variant="secondary"
          isLoading={isForgetting}
          onClick={() => {
            void forgotten();
          }}
        >
          <Icon of={ArrowUTurnLeftIcon} size={16} />
          {say('screens.adminArea.correctionPicker.useWhatTheFilesSay')}
        </Button>
      </DialogFooter>
    </DialogCompanion>
  );
};

CorrectionPicker.displayName = 'CorrectionPicker';

export { CorrectionPicker };
