import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CouldNotRead } from '@ValenceUI/CouldNotRead';
import { ScopedField } from '@ValenceUI/ScopedField';
import { Spinner } from '@ValenceUI/Spinner';
import { notify } from '@ValenceUI/notify';
import { keepLiveChannel } from '@ValenceClient/live/keepLiveChannel';
import { useLiveWindow } from '@ValenceClient/live/useLiveWindow';
import { liveQueries } from '@ValenceClient/query/liveQueries';
import { LiveGuideGrid } from '@ValenceScreens/components/LiveTvPage/components/LiveGuideGrid/LiveGuideGrid';
import { LivePlayer } from '@ValenceScreens/components/LiveTvPage/components/LivePlayer/LivePlayer';
import { readLastChannel, saveLastChannel } from '@ValenceScreens/live/lastChannelPreference';
import { groupsOf } from '@ValenceClient/live/groupsOf';
import { channelTagsOf } from '@ValenceClient/live/channelTagsOf';
import { fuzzyScore } from '@ValenceCore/functions/fuzzyScore';
import { SegmentedRow } from '@ValenceUI/SegmentedRow';
import { LiveChannelTable } from '@ValenceScreens/components/LiveTvPage/components/LiveChannelTable/LiveChannelTable';
import { readLiveView, saveLiveView } from '@ValenceScreens/live/liveViewPreference';
import { PanelCard } from '@ValenceScreens/components/PanelCard/PanelCard';
import { say } from '@ValenceI18n/say';
import type { LiveChannel, LiveGuide } from '@ValenceContracts/schemas/LiveTv';

const ALL = 'all';

const FAVOURITES = 'favourites';

const ON_AIR = 'onAir';

/**
 * Live TV: the channel playing at the top, with what is on it and what is next, and below it every
 * channel — as a table of what is on, genre and state, or as a timeline guide, remembered on the
 * device — the guide of every channel over the next few hours, which can be searched loosely — `cb` finds CBBC,
 * best matches first — narrowed to favourites or to one group of channels, and from which any
 * channel is played. The channel last watched on this
 * device plays to begin with, or else the first favourite, or else the first channel.
 */
const LiveTvPage = () => {
  const cache = useQueryClient();
  const { from, until, now } = useLiveWindow();
  const query = liveQueries.guide(new Date(from).toISOString(), new Date(until).toISOString());
  const guide = useQuery(query);
  const [chosenId, setChosenId] = useState<string | null>(readLastChannel);
  const [showing, setShowing] = useState(ALL);
  const [search, setSearch] = useState('');
  const [view, setView] = useState(readLiveView);

  const channels = guide.data?.channels ?? [];
  const chosen =
    channels.find((channel) => channel.id === chosenId) ??
    channels.find((channel) => channel.isFavourite) ??
    channels[0] ??
    null;
  const groups = [...new Set(channels.flatMap((channel) => groupsOf(channel.group)))].sort(
    (left, right) => left.localeCompare(right),
  );
  const searched = search.trim().toLowerCase();
  const narrowed = channels.filter(
    (channel) =>
      showing === ALL ||
      (showing === ON_AIR && channel.health === 'onAir') ||
      (showing === FAVOURITES ? channel.isFavourite : groupsOf(channel.group).includes(showing)),
  );
  const shown =
    searched === ''
      ? narrowed
      : narrowed
          .map((channel, at) => ({
            channel,
            at,
            score:
              channel.number === searched
                ? Number.POSITIVE_INFINITY
                : fuzzyScore(
                    searched,
                    `${channelTagsOf(channel.name).name} ${groupsOf(channel.group).join(' ')}`,
                  ),
          }))
          .filter(
            (found): found is { channel: LiveChannel; at: number; score: number } =>
              found.score !== null,
          )
          .sort((left, right) => right.score - left.score || left.at - right.at)
          .map((found) => found.channel);
  const programmesOf = (channel: LiveChannel | null) =>
    channel === null
      ? []
      : (guide.data?.programmes ?? []).filter((programme) => programme.channelId === channel.id);
  const onChosen = programmesOf(chosen);
  const onNow =
    onChosen.find(
      (programme) => Date.parse(programme.startsAt) <= now && now < Date.parse(programme.endsAt),
    ) ?? null;
  const upNext = onChosen.find((programme) => Date.parse(programme.startsAt) > now) ?? null;

  const toggleFavourite = (channel: LiveChannel) => {
    const isKept = !channel.isFavourite;

    cache.setQueryData(query.queryKey, (was: LiveGuide | undefined) =>
      was === undefined
        ? was
        : {
            ...was,
            channels: was.channels.map((one) =>
              one.id === channel.id ? { ...one, isFavourite: isKept } : one,
            ),
          },
    );

    void keepLiveChannel(channel.id, isKept).then((isDone) => {
      if (!isDone) {
        notify.failed(say('screens.liveTvPage.thatCouldNotBeKept'));
        void cache.invalidateQueries({ queryKey: liveQueries.key });
      }
    });
  };

  if (guide.isError) {
    return (
      <CouldNotRead
        said={say('common.thatCouldNotBeRead')}
        isTryingAgain={guide.isFetching}
        onTryAgain={() => {
          void guide.refetch();
        }}
      />
    );
  }

  if (guide.isPending) {
    return <Spinner isCentered label={say('common.reading')} />;
  }

  if (chosen === null) {
    return (
      <p className="mx-auto max-w-md px-4 py-24 text-center text-sm text-text-muted">
        {say('screens.liveTvPage.noChannelsYet')}
      </p>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-[90rem] flex-col gap-6 px-4 pb-16 pt-6 lg:px-8">
      <div className="mx-auto w-full max-w-5xl">
        <LivePlayer
          channel={chosen}
          onNow={onNow}
          upNext={upNext}
          now={now}
          onToggleFavourite={() => {
            toggleFavourite(chosen);
          }}
          hasProxy={guide.data.hasProxy}
        />
      </div>

      <div className="rounded-2xl bg-[var(--frame-panel)] [--card-shell:var(--frame-card)]">
        <PanelCard
          title={say('screens.liveTvPage.guide')}
          isFlush
          actions={
            <>
              <SegmentedRow
                label={say('screens.liveTvPage.showChannelsAs')}
                size="sm"
                items={[
                  { id: 'list', label: say('screens.liveTvPage.list') },
                  { id: 'guide', label: say('screens.liveTvPage.guide') },
                ]}
                value={view}
                onSelect={(next) => {
                  const chosen = next === 'guide' ? 'guide' : 'list';

                  setView(chosen);
                  saveLiveView(chosen);
                }}
              />
              <ScopedField
                className="w-full sm:w-96"
                label={say('screens.liveTvPage.findAChannel')}
                isLabelHidden
                placeholder={say('screens.liveTvPage.findAChannel')}
                value={search}
                onValueChange={setSearch}
                choices={[
                  {
                    label: say('screens.liveTvPage.whichChannels'),
                    options: [
                      { id: ALL, label: say('screens.liveTvPage.allChannels') },
                      { id: ON_AIR, label: say('screens.liveTvPage.onAirNow') },
                      { id: FAVOURITES, label: say('common.favourites') },
                      ...groups.map((group) => ({
                        id: group,
                        label: group,
                        group: say('screens.liveTvPage.groups'),
                      })),
                    ],
                    value: showing,
                    onChange: setShowing,
                  },
                ]}
              />
            </>
          }
        >
          {shown.length === 0 ? (
            <p className="py-10 text-center text-sm text-text-muted">
              {showing === FAVOURITES
                ? say('screens.liveTvPage.noFavouritesYet')
                : say('common.nothingHereMatchesThat')}
            </p>
          ) : view === 'list' ? (
            <LiveChannelTable
              channels={shown}
              programmes={guide.data.programmes}
              now={now}
              chosenId={chosen.id}
              onChoose={(channelId) => {
                setChosenId(channelId);
                saveLastChannel(channelId);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onToggleFavourite={toggleFavourite}
              hasProxy={guide.data.hasProxy}
            />
          ) : (
            <LiveGuideGrid
              channels={shown}
              programmes={guide.data.programmes}
              from={from}
              until={until}
              now={now}
              chosenId={chosen.id}
              onChoose={(channelId) => {
                setChosenId(channelId);
                saveLastChannel(channelId);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onToggleFavourite={toggleFavourite}
            />
          )}
        </PanelCard>
      </div>
    </div>
  );
};

LiveTvPage.displayName = 'LiveTvPage';

export { LiveTvPage };
