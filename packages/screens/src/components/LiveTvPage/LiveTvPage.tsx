import { Tv as EmptyTvIcon } from '@keyline-icons/react/fill';
import { NothingHere } from '@ValenceUI/NothingHere';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CouldNotRead } from '@ValenceUI/CouldNotRead';
import { ScopedField } from '@ValenceUI/ScopedField';
import { Spinner } from '@ValenceUI/Spinner';
import { notify } from '@ValenceUI/notify';
import { useKeepLiveChannel } from '@ValenceClient/live/useKeepLiveChannel';
import { narrowLiveChannels } from '@ValenceClient/live/narrowLiveChannels';
import { onNowAndNext } from '@ValenceClient/live/onNowAndNext';
import { LIVE_SHOWING } from '@ValenceClient/live/LIVE_SHOWING';
import { useLiveWindow } from '@ValenceClient/live/useLiveWindow';
import { liveQueries } from '@ValenceClient/query/liveQueries';
import { LiveGuideGrid } from '@ValenceScreens/components/LiveTvPage/components/LiveGuideGrid/LiveGuideGrid';
import { LivePlayer } from '@ValenceScreens/components/LiveTvPage/components/LivePlayer/LivePlayer';
import { readLastChannel, saveLastChannel } from '@ValenceScreens/live/lastChannelPreference';
import { groupsOf } from '@ValenceClient/live/groupsOf';
import { SegmentedRow } from '@ValenceUI/SegmentedRow';
import { LiveChannelTable } from '@ValenceScreens/components/LiveTvPage/components/LiveChannelTable/LiveChannelTable';
import { readLiveView, saveLiveView } from '@ValenceScreens/live/liveViewPreference';
import { PanelCard } from '@ValenceUI/PanelCard';
import { say } from '@ValenceI18n/say';

const { all: ALL, favourites: FAVOURITES, onAir: ON_AIR } = LIVE_SHOWING;

/**
 * Says a channel could not be kept as a favourite.
 */
const failedToKeep = () => {
  notify.failed(say('screens.liveTvPage.thatCouldNotBeKept'));
};

/**
 * Live TV: the channel playing at the top, with what is on it and what is next, and below it every
 * channel — as a table of what is on, genre and state, or as a timeline guide, remembered on the
 * device — the guide of every channel over the next few hours, which can be searched loosely — `cb` finds CBBC,
 * best matches first — narrowed to favourites or to one group of channels, and from which any
 * channel is played. The channel last watched on this
 * device plays to begin with, or else the first favourite, or else the first channel.
 */
const LiveTvPage = () => {
  const { from, until, now } = useLiveWindow();
  const query = liveQueries.guide(new Date(from).toISOString(), new Date(until).toISOString());
  const guide = useQuery(query);
  const [chosenId, setChosenId] = useState<string | null>(readLastChannel);
  const [showing, setShowing] = useState<string>(ALL);
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
  const shown = narrowLiveChannels(channels, showing, search);
  const { onNow, upNext } = onNowAndNext(guide.data?.programmes ?? [], chosen?.id ?? null, now);
  const toggleFavourite = useKeepLiveChannel(query.queryKey, failedToKeep);

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
      <NothingHere
        of={EmptyTvIcon}
        title={say('screens.liveTvPage.noLiveChannelsYet')}
        detail={say('screens.liveTvPage.noChannelsAndHowToAddThem')}
        fills
      />
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
