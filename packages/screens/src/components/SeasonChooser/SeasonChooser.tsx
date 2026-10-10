import { useCallback, useId, useMemo, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@ValenceUI/Badge';
import { DataTable } from '@ValenceUI/DataTable';
import { FormField } from '@ValenceUI/FormField';
import { Spinner } from '@ValenceUI/Spinner';
import { Switch } from '@ValenceUI/Switch';
import { requestsQueries } from '@ValenceClient/query/requestsQueries';
import { nameSeason } from '@ValenceClient/library/nameSeason';
import { SEASON_STANDING_NAMES } from '@ValenceClient/requests/SEASON_STANDING_NAMES';
import { isSeasonHeld } from '@ValenceClient/requests/isSeasonHeld';
import { theSeasonsTicked } from '@ValenceClient/requests/theSeasonsTicked';
import { tickASeason } from '@ValenceClient/requests/tickASeason';
import { tickEverySeason } from '@ValenceClient/requests/tickEverySeason';
import type { CatalogueSeason, SeasonStanding } from '@ValenceContracts/schemas/MediaRequest';
import type { BadgeTone } from '@ValenceUI/Badge.types';
import type { DataTableColumn } from '@ValenceUI/DataTable.types';
import type { SeasonChooserProps } from './SeasonChooser.types';
import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';

const STANDING_TONES: Readonly<Record<SeasonStanding, BadgeTone>> = {
  askable: 'quiet',
  requested: 'waiting',
  partly: 'busy',
  library: 'success',
};

/**
 * Which of a series' seasons to ask for, as a row each: how many episodes it holds and the year it
 * began, with a switch to take it, one in the header to take every regular season, and one beneath
 * to get new seasons as they come.
 *
 * Specials are a row like any other: ticking them fetches them, and they are never part of every
 * season. Following new seasons is a choice of its own rather than something read from which rows
 * are ticked, except that taking no regular season at all stops following new ones too, until a
 * regular season is taken again.
 *
 * Each season says where it stands, so nobody asks again for what is already on the shelf, and one
 * the library holds whole cannot be ticked at all. A season it holds part of can, and only what it
 * is missing is fetched. Adding to a request already made, the seasons it asks for are shown ticked
 * and cannot be unticked, and new seasons stay followed where it follows them already.
 *
 * @param tmdbId - The series' catalogue id.
 * @param seasons - The seasons chosen, or null for every regular one.
 * @param onChange - Told the seasons as they change.
 * @param followsNew - Whether seasons that air later are fetched too.
 * @param onFollowsNew - Told whether they are as it changes.
 * @param alreadyAsked - The seasons a request already made asks for, where seasons are being added.
 * @param isFollowedAlready - Whether that request already gets new seasons as they come.
 */
const SeasonChooser = ({
  tmdbId,
  seasons,
  onChange,
  followsNew,
  onFollowsNew,
  alreadyAsked = [],
  isFollowedAlready = false,
}: SeasonChooserProps) => {
  const followId = useId();
  const listed = useQuery(requestsQueries.seriesSeasons(tmdbId));
  const rows = useMemo(() => listed.data ?? [], [listed.data]);
  const ticked = useMemo(() => theSeasonsTicked(seasons, rows), [seasons, rows]);
  const open = useMemo(() => rows.filter((one) => one.season > 0 && !isSeasonHeld(one)), [rows]);
  const isEveryOne =
    seasons === null ||
    (open.length > 0 &&
      open.every((one) => ticked.includes(one.season) || alreadyAsked.includes(one.season)));

  const wasFollowing = useRef(false);

  const choose = useCallback(
    (next: number[] | null) => {
      onChange(next);

      const isAnyRegular = next === null || [...next, ...alreadyAsked].some((season) => season > 0);

      if (followsNew && !isAnyRegular) {
        wasFollowing.current = true;
        onFollowsNew(false);
      } else if (wasFollowing.current && isAnyRegular) {
        wasFollowing.current = false;
        onFollowsNew(true);
      }
    },
    [alreadyAsked, followsNew, onChange, onFollowsNew],
  );

  const columns = useMemo<DataTableColumn<CatalogueSeason>[]>(
    () => [
      {
        id: 'take',
        enableSorting: false,
        header: () => (
          <Switch
            label={say('common.everySeason')}
            isLabelHidden
            isOn={isEveryOne}
            onToggle={() => {
              choose(tickEverySeason(seasons, rows, !isEveryOne));
            }}
          />
        ),
        cell: ({ row }) => {
          const isAsked = alreadyAsked.includes(row.original.season);

          return (
            <Switch
              label={nameSeason(row.original.season)}
              isLabelHidden
              isOn={isAsked || ticked.includes(row.original.season)}
              disabled={isAsked || isSeasonHeld(row.original)}
              onToggle={() => {
                choose(tickASeason(seasons, rows, row.original.season));
              }}
            />
          );
        },
      },
      {
        id: 'season',
        header: say('common.season'),
        enableSorting: false,
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-sm text-text">
            {nameSeason(row.original.season)}
          </span>
        ),
      },
      {
        id: 'episodes',
        header: say('common.episodes'),
        enableSorting: false,
        cell: ({ row }) => (
          <span className="text-sm text-text-muted">{row.original.episodeCount.toString()}</span>
        ),
      },
      {
        id: 'aired',
        header: say('screens.seasonChooser.firstAired'),
        enableSorting: false,
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-sm text-text-muted">
            {row.original.firstAired === null ? '—' : row.original.firstAired.slice(0, 4)}
          </span>
        ),
      },
      {
        id: 'standing',
        header: say('common.status'),
        enableSorting: false,
        cell: ({ row }) => (
          <Badge size="sm" tone={STANDING_TONES[row.original.standing]}>
            {SEASON_STANDING_NAMES[row.original.standing]}
          </Badge>
        ),
      },
    ],
    [alreadyAsked, choose, isEveryOne, rows, seasons, ticked],
  );

  return (
    <FormField label={say('screens.seasonChooser.seasons')}>
      {listed.data === undefined ? (
        <Spinner
          isCentered
          label={say('screens.seasonChooser.askingTheCatalogueForItsSeasons')}
          size="sm"
        />
      ) : (
        <div className="flex flex-col gap-2">
          <DataTable
            label={say('screens.seasonChooser.whichSeasons')}
            columns={columns}
            rows={rows}
            getRowId={(one) => one.season.toString()}
            height="compact"
            emptyMessage={say('screens.seasonChooser.theCatalogueListsNoSeasonsFor')}
          />

          <p className="text-xs text-text-muted">
            {isEveryOne
              ? say('common.everySeason')
              : ticked.length === 0
                ? say('screens.seasonChooser.noSeasonIsTakenYet')
                : sayCount('screens.seasonChooser.chosenOfSeasons', open.length, {
                    length: ticked.filter((season) => season > 0).length.toString(),
                  })}
          </p>

          <div className="flex flex-col gap-1 pt-2">
            <Switch
              label={say('common.getNewSeasonsAsTheyCome')}
              isOn={isFollowedAlready || followsNew}
              disabled={isFollowedAlready}
              onToggle={() => {
                wasFollowing.current = false;
                onFollowsNew(!followsNew);
              }}
              describedBy={followId}
            />
            <p id={followId} className="text-xs text-text-muted">
              {say('common.fetchesEachNewSeasonAsIt')}
            </p>
          </div>
        </div>
      )}
    </FormField>
  );
};

SeasonChooser.displayName = 'SeasonChooser';

export { SeasonChooser };
