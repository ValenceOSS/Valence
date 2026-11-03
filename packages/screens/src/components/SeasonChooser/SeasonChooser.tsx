import { Fragment, useCallback, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CircleCheck as CircleCheckIcon, Plus as PlusIcon } from '@keyline-icons/react';
import { CircleCheck as CircleCheckFilledIcon } from '@keyline-icons/react/fill';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import { Spinner } from '@ValenceUI/Spinner';
import { RAIL } from '@ValenceUI/tokens/rail';
import { requestsQueries } from '@ValenceClient/query/requestsQueries';
import { nameSeason } from '@ValenceClient/library/nameSeason';
import { SEASON_STANDING_NAMES } from '@ValenceClient/requests/SEASON_STANDING_NAMES';
import { isSeasonHeld } from '@ValenceClient/requests/isSeasonHeld';
import { theSeasonsTicked } from '@ValenceClient/requests/theSeasonsTicked';
import { tickASeason } from '@ValenceClient/requests/tickASeason';
import { tickEverySeason } from '@ValenceClient/requests/tickEverySeason';
import type { ReactNode } from 'react';
import type { SeasonChooserProps } from './SeasonChooser.types';
import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';

const COVER =
  'flex aspect-[2/3] w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-surface-raised ring-1 ring-line';

/**
 * One row of the seasons to ask for: a cover, what it is and what it holds, and a tick.
 *
 * @param cover - The season's poster, or what stands in for one.
 * @param name - What the row is.
 * @param label - What its tick is called, read out.
 * @param says - What it holds and where it stands.
 * @param isOn - Whether it is ticked.
 * @param isLocked - Whether the tick cannot be changed.
 * @param onToggle - Told to tick it or untick it.
 * @returns The row.
 */
const rowOf = (
  cover: ReactNode,
  name: string,
  label: string,
  says: string,
  isOn: boolean,
  isLocked: boolean,
  onToggle: () => void,
) => (
  <li className="flex items-center gap-4 border-t border-[var(--surface-line)] py-3 first:border-t-0">
    <span className={COVER}>{cover}</span>

    <span className="flex min-w-0 flex-1 flex-col gap-1">
      <span className="truncate text-sm font-medium text-text">{name}</span>
      <span className="text-xs text-text-muted">{says}</span>
    </span>

    <Button
      variant={isOn ? 'confirm' : 'secondary'}
      size="md"
      isIconOnly
      label={label}
      role="switch"
      aria-checked={isOn}
      disabled={isLocked}
      onClick={onToggle}
    >
      <Icon of={isOn ? CircleCheckFilledIcon : CircleCheckIcon} size={16} />
    </Button>
  </li>
);

/**
 * Which of a series' seasons to ask for, drawn as a programme's episodes are: a heading with a way
 * to tick every regular season beside it, and a row for each season — its poster, or its number
 * where it has none, its name and what it holds, and a tick to ask for it — ending with a row to
 * get new seasons as they air.
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
  const listed = useQuery(requestsQueries.seriesSeasons(tmdbId));
  const rows = useMemo(() => listed.data ?? [], [listed.data]);
  const ticked = useMemo(() => theSeasonsTicked(seasons, rows), [seasons, rows]);
  const open = useMemo(() => rows.filter((one) => one.season > 0 && !isSeasonHeld(one)), [rows]);
  const isEveryOne =
    seasons === null ||
    (open.length > 0 &&
      open.every((one) => ticked.includes(one.season) || alreadyAsked.includes(one.season)));
  const isFollowing = isFollowedAlready || followsNew;

  const [wasFollowing, setWasFollowing] = useState(false);

  const choose = useCallback(
    (next: number[] | null) => {
      onChange(next);

      const isAnyRegular = next === null || [...next, ...alreadyAsked].some((season) => season > 0);

      if (followsNew && !isAnyRegular) {
        setWasFollowing(true);
        onFollowsNew(false);
      } else if (wasFollowing && isAnyRegular) {
        setWasFollowing(false);
        onFollowsNew(true);
      }
    },
    [alreadyAsked, followsNew, onChange, onFollowsNew, wasFollowing],
  );

  const followNewOnes = useCallback(() => {
    setWasFollowing(false);
    onFollowsNew(!followsNew);
  }, [followsNew, onFollowsNew]);

  return (
    <div className="flex flex-col gap-3">
      <header className="flex items-center justify-between gap-3">
        <h3 className={RAIL.title}>{say('screens.seasonChooser.seasons')}</h3>

        {rows.length === 0 ? null : (
          <Button
            variant="soft"
            size="md"
            isPill
            role="switch"
            aria-checked={isEveryOne}
            onClick={() => {
              choose(tickEverySeason(seasons, rows, !isEveryOne));
            }}
          >
            <Icon of={isEveryOne ? CircleCheckFilledIcon : CircleCheckIcon} size={16} />
            {say('common.everySeason')}
          </Button>
        )}
      </header>

      {listed.data === undefined ? (
        <Spinner
          isCentered
          label={say('screens.seasonChooser.askingTheCatalogueForItsSeasons')}
          size="sm"
        />
      ) : rows.length === 0 ? (
        <p className="text-sm text-text-muted">
          {say('screens.seasonChooser.theCatalogueListsNoSeasonsFor')}
        </p>
      ) : (
        <>
          <ul aria-label={say('screens.seasonChooser.whichSeasons')} className="flex flex-col">
            {rows.map((row) => {
              const name = row.name ?? nameSeason(row.season);
              const isAsked = alreadyAsked.includes(row.season);

              return (
                <Fragment key={row.season}>
                  {rowOf(
                    row.posterUrl === null || row.posterUrl === undefined ? (
                      <span className="text-lg font-semibold text-text-muted">
                        {row.season.toString()}
                      </span>
                    ) : (
                      <img
                        src={row.posterUrl}
                        alt=""
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                    ),
                    name,
                    name,
                    [
                      sayCount('common.count.episodes', row.episodeCount),
                      row.firstAired?.slice(0, 4) ?? null,
                      SEASON_STANDING_NAMES[row.standing],
                    ]
                      .filter((part) => part !== null)
                      .join(' · '),
                    isAsked || ticked.includes(row.season),
                    isAsked || isSeasonHeld(row),
                    () => {
                      choose(tickASeason(seasons, rows, row.season));
                    },
                  )}
                </Fragment>
              );
            })}

            {rowOf(
              <Icon of={PlusIcon} size={22} tone="muted" />,
              say('phone.theSeasons.newSeasons'),
              say('common.getNewSeasonsAsTheyCome'),
              say('phone.theSeasons.fetchedAsEachOneAirs'),
              isFollowing,
              isFollowedAlready,
              followNewOnes,
            )}
          </ul>

          <p className="text-xs text-text-muted">
            {isEveryOne
              ? say('common.everySeason')
              : ticked.length === 0
                ? say('screens.seasonChooser.noSeasonIsTakenYet')
                : sayCount('screens.seasonChooser.chosenOfSeasons', open.length, {
                    length: ticked.filter((season) => season > 0).length.toString(),
                  })}
          </p>
        </>
      )}
    </div>
  );
};

SeasonChooser.displayName = 'SeasonChooser';

export { SeasonChooser };
