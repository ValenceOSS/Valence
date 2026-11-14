import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown as ChevronDownIcon, ListVideo as ListVideoIcon } from '@keyline-icons/react';
import {
  CircleCheck as CircleCheckFilledIcon,
  ListVideo as ListVideoFilledIcon,
} from '@keyline-icons/react/fill';
import { Button } from '@ValenceUI/Button';
import { HoverHighlight } from '@ValenceUI/HoverHighlight';
import { Icon } from '@ValenceUI/Icon';
import { OptionMenu } from '@ValenceUI/OptionMenu';
import { PopoverPanel } from '@ValenceUI/PopoverPanel';
import { ScrollFade } from '@ValenceUI/ScrollFade';
import { cn } from '@ValenceUI/cn';
import { useSlidingHighlight } from '@ValenceUI/useSlidingHighlight';
import { artworkUrl } from '@ValenceClient/library/artworkUrl';
import { describeLength } from '@ValenceClient/books/describeLength';
import { nameSeason } from '@ValenceClient/library/nameSeason';
import { libraryQueries } from '@ValenceClient/query/libraryQueries';
import { describeEpisodeNumbers } from '@ValenceCore/functions/describeEpisodeNumbers';
import { Equaliser } from '@ValenceScreens/components/Equaliser/Equaliser';
import { PLAYER_MENU_OFFSET } from '@ValenceScreens/components/VideoPlayer/PLAYER_MENU_OFFSET';
import { gatherSeasons } from './gatherSeasons';
import type { EpisodeMenuProps } from './EpisodeMenu.types';
import { say } from '@ValenceI18n/say';

const NO_SEASON = 'none';

/**
 * Names a season for the switcher, falling back to a neutral name for anything the scanner could
 * not place in one.
 *
 * @param seasonNumber - The season, where it is known.
 * @returns What to call it.
 */
const headingOf = (seasonNumber: number | null): string =>
  seasonNumber === null ? say('common.episodes') : nameSeason(seasonNumber);

/**
 * Offers every episode of the programme without leaving the player, one season at a time, laid
 * out as the chapter list is: each episode a row with its still, its title, what happens in it,
 * its number and how long it runs or that it has been watched. What each is about comes from the
 * programme's own listing, read once as the menu opens. The one on now is outlined and the rest sit quieter
 * until pointed at, with one highlight sliding between them. A season switcher heads the list where
 * there is more than one season. Opens on the season playing, scrolled to the episode on now.
 *
 * @param episodes - Every episode of the programme.
 * @param playingId - Which one is on now.
 * @param onSelect - Called with the episode they chose.
 * @param watchedFractionFor - How to ask how far through a given episode they are.
 * @param onOpenChange - Called as the menu opens or closes, so the bar stays put while it is open.
 * @param isDisabled - Whether the menu is inert, as it is while a session is starting.
 * @param isPlaying - Whether the player is playing, so the mark on the one on now moves with it.
 */
const EpisodeMenu = ({
  episodes,
  playingId,
  onSelect,
  watchedFractionFor,
  onOpenChange,
  isDisabled = false,
  isPlaying = true,
}: EpisodeMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [shownSeason, setShownSeason] = useState<number | null>(null);
  const { containerRef, rect, follow, clear } = useSlidingHighlight();
  const playingRef = useRef<HTMLLIElement | null>(null);

  const seasons = useMemo(() => gatherSeasons(episodes), [episodes]);
  const playing = episodes.find((episode) => episode.id === playingId) ?? null;
  const listing = useQuery({
    ...libraryQueries.show(playing?.libraryId ?? null, playing?.seriesId ?? null),
    enabled: isOpen && playing !== null && (playing.seriesId ?? null) !== null,
  });
  const overviewOf = (episode: (typeof episodes)[number]): string | null =>
    listing.data?.shape
      ?.find((one) => one.seasonNumber === episode.seasonNumber)
      ?.episodes.find((one) => one.episodeNumber === episode.episodeNumber)?.overview ?? null;

  useEffect(() => {
    if (isOpen) {
      playingRef.current?.scrollIntoView({ block: 'nearest' });
    }
  }, [isOpen]);

  if (episodes.length === 0) {
    return null;
  }

  const show = (next: boolean) => {
    if (next) {
      setShownSeason(playing?.seasonNumber ?? seasons[0]?.seasonNumber ?? null);
    }

    setIsOpen(next);
    onOpenChange?.(next);
  };

  const season = seasons.find((candidate) => candidate.seasonNumber === shownSeason) ?? seasons[0];

  return (
    <PopoverPanel
      tone="default"
      offset={PLAYER_MENU_OFFSET}
      label={say('common.episodes')}
      isDisabled={isDisabled}
      isOpen={isOpen}
      onOpenChange={show}
      trigger={
        isOpen ? <Icon of={ListVideoFilledIcon} size={20} /> : <Icon of={ListVideoIcon} size={20} />
      }
      className="w-[min(27rem,calc(100vw-1.5rem))] p-1.5"
    >
      {seasons.length < 2 ? null : (
        <div className="flex items-center justify-between gap-2 px-1.5 pt-1 pb-2">
          <span className="min-w-0 truncate text-xs text-text-muted">
            {playing?.seriesTitle ?? ''}
          </span>

          <OptionMenu
            label={say('screens.seasonChooser.seasons')}
            triggerShape="quiet"
            align="end"
            trigger={
              <span className="flex items-center gap-1 text-sm font-medium">
                {headingOf(season?.seasonNumber ?? null)}
                <Icon of={ChevronDownIcon} size={14} />
              </span>
            }
            groups={[
              {
                name: say('screens.seasonChooser.seasons'),
                options: seasons.map((each) => ({
                  id: each.seasonNumber === null ? NO_SEASON : each.seasonNumber.toString(),
                  label: headingOf(each.seasonNumber),
                })),
                selectedId:
                  season?.seasonNumber === null || season === undefined
                    ? NO_SEASON
                    : season.seasonNumber.toString(),
                onSelect: (id: string) => {
                  setShownSeason(id === NO_SEASON ? null : Number(id));
                },
              },
            ]}
          />
        </div>
      )}

      <ScrollFade className="max-h-[min(30rem,60vh)] pe-1">
        <div
          ref={containerRef}
          onPointerMove={follow}
          onPointerLeave={clear}
          onFocusCapture={follow}
          onBlurCapture={clear}
          className="relative"
        >
          <HoverHighlight rect={rect} radius="nested" />

          <ul className="relative flex flex-col gap-0.5">
            {(season?.episodes ?? []).map((episode) => {
              const isOn = episode.id === playingId;
              const watched = watchedFractionFor?.(episode.id);
              const isWatched = watched !== undefined && watched >= 1;
              const through = watched !== undefined && watched > 0 && !isWatched ? watched : null;
              const overview = overviewOf(episode);
              const number =
                episode.episodeNumber === null || episode.episodeNumber === undefined
                  ? null
                  : describeEpisodeNumbers(episode.episodeNumber, episode.episodeNumberEnd);

              return (
                <li
                  key={episode.id}
                  {...(isOn
                    ? {
                        ref: (element: HTMLLIElement | null) => {
                          playingRef.current = element;
                        },
                      }
                    : {})}
                >
                  <Button
                    variant="bare"
                    size="none"
                    hasTooltip={false}
                    aria-current={isOn ? 'true' : undefined}
                    {...(isOn
                      ? { onPointerEnter: clear, onFocus: clear }
                      : { 'data-highlight': episode.id })}
                    onClick={() => {
                      show(false);
                      onSelect(episode);
                    }}
                    className={cn(
                      'flex w-full items-start gap-3 rounded-lg px-1.5 py-2 text-start outline-none focus-visible:focus-ring',
                      'transition-[background-color,scale,opacity] duration-[var(--duration-fast)] ease-[var(--ease-out)]',
                      'active:scale-[0.99] motion-reduce:transition-none',
                      isOn
                        ? 'bg-surface-raised'
                        : 'opacity-55 hover-hover:hover:opacity-100 focus-visible:opacity-100',
                    )}
                  >
                    <span
                      className={cn(
                        'relative block aspect-video w-[5.5rem] shrink-0 overflow-hidden rounded-md bg-shade',
                        isOn ? 'ring-2 ring-text/40' : 'ring-1 ring-line',
                      )}
                    >
                      {episode.hasBackdrop === true ? (
                        <img
                          src={artworkUrl(episode.id, 'backdrop', { size: 'small' })}
                          alt=""
                          loading="lazy"
                          className="size-full object-cover"
                        />
                      ) : null}

                      {through === null ? null : (
                        <span aria-hidden className="absolute inset-x-0 bottom-0 h-1 bg-shade/50">
                          <span
                            className="block h-full origin-left bg-on-scrim"
                            style={{ transform: `scaleX(${through.toString()})` }}
                          />
                        </span>
                      )}
                    </span>

                    <span className="flex min-w-0 flex-1 flex-col gap-1">
                      <span
                        className={cn(
                          'truncate text-sm text-text',
                          isOn ? 'font-semibold' : 'font-medium',
                        )}
                      >
                        {episode.title}
                      </span>

                      {overview === null || overview === '' ? null : (
                        <span className="line-clamp-2 text-xs leading-snug text-text-muted">
                          {overview}
                        </span>
                      )}

                      <span className="flex items-center gap-1.5 truncate text-xs tabular-nums text-text-muted">
                        {isOn ? (
                          <Equaliser
                            label={say('common.nowPlaying')}
                            isMoving={isPlaying}
                            className="text-text"
                          />
                        ) : null}
                        {number === null
                          ? null
                          : say('screens.showDialog.missingRow.episodeEpisodeNumber', {
                              episodeNumber: number,
                            })}
                      </span>
                    </span>

                    <span className="flex w-12 shrink-0 justify-end pt-0.5 pe-1 text-xs tabular-nums text-text-muted">
                      {isWatched ? (
                        <Icon
                          of={CircleCheckFilledIcon}
                          size={16}
                          tone="success"
                          label={say('common.watched')}
                        />
                      ) : (
                        describeLength(episode.durationSeconds)
                      )}
                    </span>
                  </Button>
                </li>
              );
            })}
          </ul>
        </div>
      </ScrollFade>
    </PopoverPanel>
  );
};

EpisodeMenu.displayName = 'EpisodeMenu';

export { EpisodeMenu };
