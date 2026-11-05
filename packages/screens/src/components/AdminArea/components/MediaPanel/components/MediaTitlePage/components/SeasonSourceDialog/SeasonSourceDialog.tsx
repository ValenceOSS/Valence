import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowUTurnLeft as ArrowUTurnLeftIcon,
  Search as SearchIcon,
} from '@keyline-icons/react/fill';
import { ChevronLeft as ChevronLeftIcon } from '@keyline-icons/react';
import { chooseSeasonSource } from '@ValenceClient/admin/chooseSeasonSource';
import { fetchTitleCandidates } from '@ValenceClient/admin/fetchTitleCandidates';
import { scoreOfMatch } from '@ValenceClient/admin/scoreOfMatch';
import { adminQueries } from '@ValenceClient/query/adminQueries';
import { Button } from '@ValenceUI/Button';
import { ChoiceList } from '@ValenceUI/ChoiceList';
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
import { nameOfCatalogueShow } from '@ValenceScreens/admin/nameOfCatalogueShow';
import type { CatalogueMatch } from '@ValenceClient/admin/fetchAdmin';
import type { ChooseSeasonSource } from '@ValenceContracts/schemas/SeasonSource';
import type { TitleCandidates } from '@ValenceContracts/schemas/TitleList';
import type { SeasonSourceDialogProps } from './SeasonSourceDialog.types';
import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';

/**
 * Says a season's episodes come from a season of another show in the catalogue, for a season the
 * catalogue lists as a show of its own, such as a revival with new presenters whose files carry on
 * the old show's numbering. The show stays the one it is matched to; only the season's episodes,
 * their pictures and dates are read from the other. The show is found by searching, as a match is
 * fixed, leaving out the show the season already belongs to, and then its season is chosen: the
 * one it is read from now, or the only one the show has, chosen already.
 *
 * @param mediaId - Any episode of the season.
 * @param showName - The show the season belongs to, searched for first.
 * @param ownExternalId - The catalogue entry the show is matched to, left out of what is found.
 * @param current - The season it is read from now, or nothing for the show's own.
 * @param isOpen - Whether it is open.
 * @param onClose - Closes it.
 * @param onChanged - Told the job reading the season again.
 */
const SeasonSourceDialog = ({
  mediaId,
  showName,
  ownExternalId,
  current,
  isOpen,
  onClose,
  onChanged,
}: SeasonSourceDialogProps) => {
  const cache = useQueryClient();
  const [query, setQuery] = useState(showName);
  const [found, setFound] = useState<
    (TitleCandidates & { query: string; page: number }) | { problem: string } | null
  >(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isShowingMore, setIsShowingMore] = useState(false);
  const [chosen, setChosen] = useState<CatalogueMatch | null>(null);
  const [season, setSeason] = useState<number | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const seasons = useQuery(adminQueries.catalogueSeasons(mediaId, chosen?.externalId ?? null));
  const offered =
    found === null || 'problem' in found
      ? []
      : found.matches.filter((match) => match.externalId !== ownExternalId);

  /**
   * Asks the catalogue for shows under a name or a pasted id, from its first page.
   *
   * @param asked - The name or id.
   */
  const look = async (asked: string) => {
    setIsSearching(true);

    const answer = await fetchTitleCandidates(asked, 'tv');

    setFound('problem' in answer ? answer : { ...answer, query: asked, page: 1 });
    setIsSearching(false);
  };

  /**
   * Lists the next page of what the last search found.
   */
  const lookFurther = async () => {
    if (found === null || 'problem' in found) {
      return;
    }

    setIsShowingMore(true);

    const answer = await fetchTitleCandidates(found.query, 'tv', found.page + 1);

    setIsShowingMore(false);

    if ('problem' in answer) {
      notify.failed(answer.problem);

      return;
    }

    setFound({
      ...answer,
      matches: [...found.matches, ...answer.matches],
      query: found.query,
      page: found.page + 1,
    });
  };

  useEffect(() => {
    if (isOpen && showName.trim() !== '') {
      void look(showName);
    }
  }, [isOpen, showName]);

  useEffect(() => {
    const listed = seasons.data?.seasons ?? [];
    const now =
      current !== null && current.externalId === chosen?.externalId
        ? listed.find((one) => one.seasonNumber === current.externalSeason)
        : undefined;
    const [only, ...others] = listed;

    setSeason(
      now?.seasonNumber ?? (only !== undefined && others.length === 0 ? only.seasonNumber : null),
    );
  }, [seasons.data, current, chosen]);

  /**
   * Saves where the season is read from and follows the job reading it again.
   *
   * @param source - The show and its season, or nothing for the show's own.
   */
  const send = async (source: ChooseSeasonSource['source']) => {
    setIsBusy(true);

    const answer = await chooseSeasonSource(mediaId, source);

    setIsBusy(false);

    if (answer.kind === 'refused') {
      notify.failed(answer.reason);

      return;
    }

    void cache.invalidateQueries({ queryKey: adminQueries.seasonSource(mediaId).queryKey });
    notify.worked(say('screens.adminArea.seasonSourceDialog.readingTheSeasonAgain'));
    onChanged(answer.jobId);
    onClose();
  };

  return (
    <Dialog
      label={say('screens.adminArea.seasonSourceDialog.fixSeasonMatch')}
      isOpen={isOpen}
      onClose={onClose}
    >
      <DialogTitle
        size="compact"
        title={say('screens.adminArea.seasonSourceDialog.fixSeasonMatch')}
      />
      <DialogContent className="flex flex-col gap-4">
        {chosen === null ? (
          <>
            <p className="font-body text-sm text-text-muted">
              {current === null
                ? say('screens.adminArea.seasonSourceDialog.takesThisSeasonsEpisodes')
                : say('screens.adminArea.seasonSourceDialog.thisSeasonsEpisodesComeFrom', {
                    show: nameOfCatalogueShow(current),
                    season: current.externalSeason.toString(),
                  })}
            </p>
            <form
              onSubmit={(event) => {
                event.preventDefault();

                if (query.trim() !== '') {
                  void look(query);
                }
              }}
            >
              <ScopedField
                label={say('screens.adminArea.matchPicker.searchForASeries')}
                isLabelHidden
                value={query}
                onValueChange={setQuery}
                hasFocusOnMount
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
            ) : offered.length === 0 && !found.hasMore ? (
              <p className="font-body text-sm text-text-muted">
                {say('screens.adminArea.fixMatchDialog.nothingCameBackForQuery', {
                  query: found.query,
                })}
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                <CatalogueMatchList
                  matches={offered}
                  onChoose={(match) => {
                    setChosen(match);
                    setSeason(null);
                  }}
                  scoreOf={(match) => scoreOfMatch({ title: showName, year: null }, match)}
                />
                {found.hasMore ? (
                  <div className="flex justify-end">
                    <Button
                      variant="secondary"
                      size="sm"
                      isLoading={isShowingMore}
                      onClick={() => {
                        void lookFurther();
                      }}
                    >
                      {say('common.showMore')}
                    </Button>
                  </div>
                ) : null}
              </div>
            )}
          </>
        ) : seasons.isPending ? (
          <Spinner isCentered size="sm" label={say('common.askingTheCatalogue')} />
        ) : seasons.isError ? (
          <CouldNotRead
            said={say('error.common.theCatalogueDoesNotKnowThat')}
            why={seasons.error.message}
            onTryAgain={() => {
              void seasons.refetch();
            }}
            isTryingAgain={seasons.isFetching}
          />
        ) : seasons.data.seasons.length === 0 ? (
          <p className="font-body text-sm text-text-muted">
            {say('screens.adminArea.seasonSourceDialog.thatShowHasNoSeasons', {
              show: nameOfCatalogueShow(chosen),
            })}
          </p>
        ) : (
          <ChoiceList
            label={say('screens.adminArea.seasonSourceDialog.seasonOfShow', {
              show: nameOfCatalogueShow(chosen),
            })}
            choices={seasons.data.seasons.map((one) => ({
              id: one.seasonNumber.toString(),
              title:
                one.name ??
                say('common.seasonSeasonNumber', { seasonNumber: one.seasonNumber.toString() }),
              detail: sayCount('common.count.episodes', one.episodeCount),
              ...(one.airDate === null ? {} : { note: one.airDate.slice(0, 4) }),
            }))}
            value={season === null ? null : season.toString()}
            onChoose={(id) => {
              setSeason(Number.parseInt(id, 10));
            }}
          />
        )}
      </DialogContent>
      <DialogFooter
        lead={
          chosen !== null ? (
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
          ) : current === null ? undefined : (
            <Button
              variant="ghost"
              size="sm"
              isLoading={isBusy}
              onClick={() => {
                void send(null);
              }}
            >
              <Icon of={ArrowUTurnLeftIcon} size={15} />
              {say('screens.adminArea.seasonSourceDialog.useTheShowsOwnSeason')}
            </Button>
          )
        }
        dismiss={{ onChoose: onClose, label: say('common.cancel') }}
        confirm={
          chosen === null
            ? undefined
            : {
                label: say('screens.adminArea.fixMatchDialog.apply'),
                isDisabled: season === null,
                isLoading: isBusy,
                onChoose: () => {
                  if (season !== null) {
                    void send({ externalId: chosen.externalId, externalSeason: season });
                  }
                },
              }
        }
      />
    </Dialog>
  );
};

SeasonSourceDialog.displayName = 'SeasonSourceDialog';

export { SeasonSourceDialog };
