import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowUTurnLeft as ArrowUTurnLeftIcon,
  Search as SearchIcon,
} from '@keyline-icons/react/fill';
import { ChevronLeft as ChevronLeftIcon } from '@keyline-icons/react';
import { searchCatalogue } from '@ValenceClient/admin/fetchAdmin';
import { correctMatch, forgetCorrection } from '@ValenceClient/library/fetchLibrary';
import { adminQueries } from '@ValenceClient/query/adminQueries';
import { isSameTitleValue } from '@ValenceCore/functions/isSameTitleValue';
import { Button } from '@ValenceUI/Button';
import { CouldNotRead } from '@ValenceUI/CouldNotRead';
import { Dialog } from '@ValenceUI/Dialog';
import { DialogContent } from '@ValenceUI/DialogContent';
import { DialogFooter } from '@ValenceUI/DialogFooter';
import { DialogTitle } from '@ValenceUI/DialogTitle';
import { Icon } from '@ValenceUI/Icon';
import { ScopedField } from '@ValenceUI/ScopedField';
import { Spinner } from '@ValenceUI/Spinner';
import { notify } from '@ValenceUI/notify';
import { CatalogueMatchList } from '@ValenceScreens/components/AdminArea/components/CatalogueMatchList/CatalogueMatchList';
import { MatchCompare } from './components/MatchCompare/MatchCompare';
import type { CatalogueMatch } from '@ValenceClient/admin/fetchAdmin';
import type { TitleField } from '@ValenceContracts/schemas/TitleEdit';
import type { FixMatchDialogProps } from './FixMatchDialog.types';
import { say } from '@ValenceI18n/say';

/**
 * Fixes what a film or a programme is matched to, in two steps: find the right catalogue entry,
 * searched for under the title's name as soon as it opens, then compare the title with it field by
 * field and tick what to take from it. Fields left unticked keep what they say now, and so do edits
 * to fields the catalogue does not fill.
 *
 * @param media - A file of the title, or nothing while it is closed.
 * @param isInShows - Whether it sits in a library of shows, so is a programme however it is matched.
 * @param onClose - Closes it.
 * @param onCorrected - Told once the match is fixed, with the job reading the title again.
 */
const FixMatchDialog = ({
  media,
  isInShows = false,
  onClose,
  onCorrected,
}: FixMatchDialogProps) => {
  const isShow = isInShows || (media?.seriesTitle !== null && media?.seriesTitle !== undefined);
  const name = media === null ? '' : (media.seriesTitle ?? media.title);
  const mediaId = media?.id ?? null;
  const [kind, setKind] = useState<'tv' | 'movie'>(isShow ? 'tv' : 'movie');
  const [query, setQuery] = useState('');
  const [found, setFound] = useState<CatalogueMatch[] | { problem: string } | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [chosen, setChosen] = useState<CatalogueMatch | null>(null);
  const [taken, setTaken] = useState<ReadonlySet<TitleField>>(new Set());
  const [isApplying, setIsApplying] = useState(false);
  const [isForgetting, setIsForgetting] = useState(false);
  const preview = useQuery({
    ...adminQueries.matchPreview(media?.id ?? '', chosen?.externalId ?? '', chosen?.kind ?? kind),
    enabled: media !== null && chosen !== null,
  });

  /**
   * Asks the catalogue what it holds under a name.
   *
   * @param asked - The name.
   * @param as - Whether to look for films or programmes.
   */
  const look = async (asked: string, as: 'tv' | 'movie') => {
    setIsSearching(true);
    setFound(await searchCatalogue(asked, as));
    setIsSearching(false);
  };

  useEffect(() => {
    if (mediaId === null) {
      return;
    }

    const as = isShow ? 'tv' : 'movie';

    setKind(as);
    setQuery(name);
    setChosen(null);
    setFound(null);

    if (name.trim() !== '') {
      void look(name, as);
    }
  }, [mediaId, name, isShow]);

  useEffect(() => {
    if (preview.data === undefined) {
      return;
    }

    setTaken(
      new Set(
        preview.data.rows
          .filter(
            (row) =>
              !isSameTitleValue(row.current.value, row.next) &&
              row.current.source !== 'edited' &&
              row.current.source !== 'locked',
          )
          .map((row) => row.field),
      ),
    );
  }, [preview.data]);

  const apply = async () => {
    if (media === null || chosen === null || preview.data === undefined) {
      return;
    }

    setIsApplying(true);

    const keep = preview.data.rows
      .filter((row) => !taken.has(row.field) && !isSameTitleValue(row.current.value, row.next))
      .map((row) => row.field);
    const outcome = await correctMatch(media.id, chosen.externalId, chosen.kind, keep);

    setIsApplying(false);

    if ('problem' in outcome) {
      notify.failed(outcome.problem);

      return;
    }

    notify.worked(say('common.correctedTheMatch'));
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
      notify.failed(say('common.thatCouldNotBePutBack'));

      return;
    }

    notify.worked(say('screens.adminArea.correctionPicker.itWillSayWhatItsFiles'));
    onCorrected(outcome.jobId);
    onClose();
  };

  const isComparing = chosen !== null;

  return (
    <Dialog
      label={say('screens.adminArea.mediaTitlePage.fixMatch')}
      isOpen={media !== null}
      onClose={onClose}
      size="stage"
    >
      <DialogTitle
        size="compact"
        title={say('screens.adminArea.mediaTitlePage.fixMatch')}
        detail={[
          isComparing ? `${name} → ${chosen.title}` : name,
          isComparing
            ? say('screens.adminArea.fixMatchDialog.stepCompare')
            : say('screens.adminArea.fixMatchDialog.stepFind'),
        ].join(' · ')}
      />

      <DialogContent className="flex flex-col gap-5">
        {isComparing ? (
          preview.isPending ? (
            <Spinner isCentered size="sm" label={say('common.askingTheCatalogue')} />
          ) : preview.isError ? (
            <CouldNotRead
              said={say('error.common.theCatalogueDoesNotKnowThat')}
              why={preview.error.message}
              onTryAgain={() => {
                void preview.refetch();
              }}
              isTryingAgain={preview.isFetching}
            />
          ) : media === null ? null : (
            <MatchCompare
              mediaId={media.id}
              preview={preview.data}
              taken={taken}
              onTake={(field, isTaken) => {
                setTaken((before) => {
                  const next = new Set(before);

                  if (isTaken) {
                    next.add(field);
                  } else {
                    next.delete(field);
                  }

                  return next;
                });
              }}
            />
          )
        ) : (
          <>
            <form
              onSubmit={(event) => {
                event.preventDefault();

                if (query.trim() !== '') {
                  void look(query, kind);
                }
              }}
            >
              <ScopedField
                label={
                  kind === 'tv'
                    ? say('screens.adminArea.matchPicker.searchForASeries')
                    : say('screens.adminArea.matchPicker.searchForAFilm')
                }
                isLabelHidden
                value={query}
                onValueChange={setQuery}
                hasFocusOnMount
                choices={[
                  {
                    label: say('common.kind'),
                    options: [
                      { id: 'movie', label: say('common.film') },
                      { id: 'tv', label: say('common.show') },
                    ],
                    value: kind,
                    onChange: (value) => {
                      const as = value === 'tv' ? 'tv' : 'movie';

                      setKind(as);

                      if (query.trim() !== '') {
                        void look(query, as);
                      }
                    },
                  },
                ]}
                submit={{
                  label: say('common.search'),
                  icon: SearchIcon,
                  isDisabled: query.trim() === '',
                  isBusy: isSearching,
                }}
              />
            </form>

            {isSearching ? (
              <Spinner size="sm" label={say('common.askingTheCatalogue')} />
            ) : found === null ? null : 'problem' in found ? (
              <p role="alert" className="font-body text-sm text-text-muted">
                {found.problem}
              </p>
            ) : found.length === 0 ? (
              <p className="font-body text-sm text-text-muted">
                {say('common.nothingCameBackUnderThatName')}
              </p>
            ) : (
              <CatalogueMatchList matches={found} onChoose={setChosen} />
            )}
          </>
        )}
      </DialogContent>

      <DialogFooter
        lead={
          isComparing ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setChosen(null);
              }}
            >
              <Icon of={ChevronLeftIcon} size={15} />
              {say('common.back')}
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              isLoading={isForgetting}
              onClick={() => {
                void forget();
              }}
            >
              <Icon of={ArrowUTurnLeftIcon} size={15} />
              {say('screens.adminArea.matchPicker.forgetTheCorrection')}
            </Button>
          )
        }
        dismiss={{ onChoose: onClose, label: say('common.cancel') }}
        confirm={
          isComparing
            ? {
                label: say('screens.adminArea.fixMatchDialog.apply'),
                onChoose: () => {
                  void apply();
                },
                isLoading: isApplying,
                isDisabled: preview.data === undefined,
              }
            : undefined
        }
      />
    </Dialog>
  );
};

FixMatchDialog.displayName = 'FixMatchDialog';

export { FixMatchDialog };
