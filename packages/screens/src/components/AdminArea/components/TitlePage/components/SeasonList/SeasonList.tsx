import { useState } from 'react';
import { ChevronRight as ChevronRightIcon } from '@keyline-icons/react';
import { Badge } from '@ValenceUI/Badge';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import { Switch } from '@ValenceUI/Switch';
import { cn } from '@ValenceUI/cn';
import { nameSeason } from '@ValenceClient/library/nameSeason';
import { PanelCard } from '@ValenceScreens/components/PanelCard/PanelCard';
import { TITLE_PART_LOOKS } from '@ValenceScreens/requests/TITLE_PART_LOOKS';
import { EpisodeTable } from '@ValenceScreens/components/AdminArea/components/TitlePage/components/EpisodeTable/EpisodeTable';
import type { TitleSeason } from '@ValenceClient/requests/seasonsOfTitle';
import type { TitlePart } from '@ValenceClient/requests/TitlePart.types';
import type { SeasonListProps } from './SeasonList.types';
import { say } from '@ValenceI18n/say';

const WORST_FIRST: readonly (TitlePart | 'notAsked')[] = [
  'failed',
  'downloading',
  'missing',
  'toApprove',
  'waiting',
];

/**
 * What a season's badge says: where its worst episode stands, or nothing where all of it is here.
 *
 * @param season - The season.
 * @returns The part to badge it as, or nothing.
 */
const badgeOf = (season: TitleSeason): TitlePart | 'notAsked' | null => {
  const parts = new Set(season.episodes.map((episode) => episode.part));

  return WORST_FIRST.find((part) => parts.has(part)) ?? null;
};

/**
 * A show's seasons on its title page, specials first, one row each: a bar of its episodes coloured
 * by where each stands, how many are here, a badge for anything needing a look, and a switch to
 * follow it. A row opens onto its episodes. Where it was asked for, a switch in its header gets new
 * seasons as they come.
 *
 * @param seasons - The seasons.
 * @param note - Where new seasons go, where that is worth saying.
 * @param isFollowing - Whether follow switches can be pressed right now.
 * @param onFollow - Told a season to follow or stop following.
 * @param followsNew - Whether new seasons are fetched as they come, or nothing where nobody asked.
 * @param onFollowsNew - Told whether they are to be.
 */
const SeasonList = ({
  seasons,
  note,
  isFollowing,
  onFollow,
  followsNew = null,
  onFollowsNew,
}: SeasonListProps) => {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <PanelCard
      title={say('screens.seasonChooser.seasons')}
      isFlush
      actions={
        note === null && followsNew === null ? null : (
          <span className="flex flex-wrap items-center gap-4">
            {note === null ? null : <span className="text-xs text-text-muted">{note}</span>}
            {followsNew === null ? null : (
              <Switch
                label={say('common.getNewSeasonsAsTheyCome')}
                isOn={followsNew}
                disabled={isFollowing}
                onToggle={() => {
                  onFollowsNew?.(!followsNew);
                }}
              />
            )}
          </span>
        )
      }
    >
      <ul className="flex flex-col divide-y divide-[var(--surface-line)]">
        {seasons.map((season) => {
          const name = nameSeason(season.season);
          const isOpen = open === season.season;
          const held = season.episodes.filter((episode) => episode.part === 'library').length;
          const badge = badgeOf(season);

          return (
            <li key={season.season} className="flex flex-col">
              <span className="flex flex-wrap items-center gap-4 py-3 pl-5 pr-3">
                <Button
                  variant="bare"
                  size="none"
                  aria-expanded={isOpen}
                  label={say(
                    isOpen
                      ? 'screens.adminArea.mediaPanel.hideTheEpisodesInName'
                      : 'screens.adminArea.mediaPanel.showTheEpisodesInName',
                    { name },
                  )}
                  onClick={() => {
                    setOpen(isOpen ? null : season.season);
                  }}
                  className="flex w-28 shrink-0 items-center gap-2 text-left"
                >
                  <Icon
                    of={ChevronRightIcon}
                    size={14}
                    className={cn(
                      'transition-transform duration-[var(--duration-fast)] ease-[var(--ease-out)] motion-reduce:transition-none',
                      isOpen ? 'rotate-90' : '',
                    )}
                  />
                  <span className="truncate text-sm font-medium text-text">{name}</span>
                </Button>

                <span
                  aria-hidden
                  className="flex min-w-24 flex-1 gap-[3px] overflow-hidden rounded-full"
                >
                  {season.episodes.map((episode) => (
                    <span
                      key={episode.episode}
                      className={cn('h-2 min-w-0 flex-1', TITLE_PART_LOOKS[episode.part].cell)}
                    />
                  ))}
                </span>

                <span className="w-16 shrink-0 text-right text-sm tabular-nums text-text-muted">
                  {say('screens.adminArea.titlePage.seasonList.heldOfTotal', {
                    held: held.toString(),
                    total: season.episodes.length.toString(),
                  })}
                </span>

                <span className="w-32 shrink-0">
                  {badge === null ? null : (
                    <Badge size="sm" tone={TITLE_PART_LOOKS[badge].tone}>
                      {TITLE_PART_LOOKS[badge].label}
                    </Badge>
                  )}
                </span>

                <Switch
                  label={say('screens.adminArea.titlePage.seasonList.followName', { name })}
                  isLabelHidden
                  isOn={season.isFollowed}
                  disabled={isFollowing}
                  onToggle={() => {
                    onFollow(season, !season.isFollowed);
                  }}
                />
              </span>

              {isOpen && season.episodes.length > 0 ? (
                <div className="border-t border-[var(--surface-line)]">
                  <EpisodeTable label={name} episodes={season.episodes} />
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    </PanelCard>
  );
};

SeasonList.displayName = 'SeasonList';

export { SeasonList };
