import { useMe } from '@ValenceClient/requests/useMe';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, ChevronDown, ListVideo, Plus, RotateCw, X } from '@keyline-icons/react-native';
import { Play } from '@keyline-icons/react-native/fill';
import { requestsQueries } from '@ValenceClient/query/requestsQueries';
import { askingFor } from '@ValenceClient/requests/askingFor';
import {
  askForMedia,
  joinMediaRequest,
  removeMediaRequest,
} from '@ValenceClient/requests/fetchMediaRequests';
import { describeOthersStillWanting } from '@ValenceClient/requests/describeOthersStillWanting';
import { describeWhoElseAsked } from '@ValenceClient/requests/describeWhoElseAsked';
import { describeMyProfileAsk } from '@ValenceClient/requests/describeMyProfileAsk';
import { mayJoinRequest } from '@ValenceClient/requests/mayJoinRequest';
import { askersOf } from '@ValenceContracts/functions/askersOf';
import { isAskedByMe } from '@ValenceContracts/functions/isAskedByMe';
import { nameTheStanding } from '@ValenceClient/requests/nameTheStanding';
import { useRequestableKinds } from '@ValenceClient/requests/useRequestableKinds';
import { progressOfRequest } from '@ValenceClient/requests/progressOfRequest';
import { formatDuration } from '@ValenceCore/functions/formatDuration';
import { ActionRow } from '@ValenceTv/components/ActionRow/ActionRow';
import { DownloadPanel } from '@ValenceTv/components/DownloadPanel/DownloadPanel';
import { TitleSpread } from '@ValenceTv/components/TitleSpread/TitleSpread';
import { joinFacts } from '@ValenceTv/library/joinFacts';
import { tokens } from '@ValenceTv/theme/tokens';
import { askLinkedServer } from '@ValenceClient/linking/askLinkedServer';
import { linkingQueries } from '@ValenceClient/query/linkingQueries';
import type { CatalogueSeason, MediaRequestAsk } from '@ValenceContracts/schemas/MediaRequest';
import { describeStreamOffer } from '@ValenceClient/streams/describeStreamOffer';
import { groupStreamOffers } from '@ValenceClient/streams/groupStreamOffers';
import type { StreamGroupId } from '@ValenceClient/streams/groupStreamOffers';
import { screenOfProfile } from '@ValenceClient/streams/screenOfProfile';
import { useMayStream } from '@ValenceClient/streams/useMayStream';
import { usePlayFromSource } from '@ValenceClient/streams/usePlayFromSource';
import { FadeIn } from '@ValenceTv/components/FadeIn/FadeIn';
import { theTvsProfile } from '@ValenceTv/playback/theTvsProfile';
import type { AskPageProps } from './AskPage.types';
import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';

const FOLLOWED_EVERY_MS = 5000;

const STARRING = 4;

const MOST_PER_GROUP = 8;

const SEASON_SAYS: Record<CatalogueSeason['standing'], string | null> = {
  askable: null,
  partly: say('common.partlyHere'),
  requested: say('common.requested'),
  library: say('common.inTheLibrary'),
};

/**
 * The page of a film or show the library does not have — or does, or has been asked for — laid out
 * as a title's own page is: its picture, what it is, who is in it and where it stands, above what
 * can be done about it.
 *
 * A film is asked for as it is. A show lists its seasons, every regular one still to be had chosen
 * to start with and Specials left for whoever wants them, and asks for those chosen, getting new
 * seasons as they come unless that is turned off. Where this viewer may pick the quality it is
 * fetched in, asking first lists the qualities on offer. A film already in the library opens its
 * own page. Somebody else's request names who asked, and can be wanted too. Somebody's own request
 * can be cancelled until it is in the library, once they have said so, since it throws away whatever
 * has downloaded — unless others want it too — and a remote's one press is easily made; while
 * something is on its way, the page keeps looking for where it has got to, and while it downloads
 * gives it a panel of its own saying how far through it is, how fast it is arriving and how long is
 * left. The page is lit by the title's own picture.
 *
 * A film a source can play, for somebody who may play from sources, has Play first, which plays
 * the stream Valence would choose for this television without downloading it, and Sources beneath,
 * which lists every stream in place of the page's actions so one can be chosen; asking for the film
 * is still there below them.
 *
 * @param kind - Whether it is a film or a show.
 * @param id - Its number in the film database.
 * @param onOpenFilm - Told to open a film the library has, by its library id.
 * @param onPlay - Told to play a film a source plays, once it is ready.
 * @param onLight - Told which picture lights the page.
 */
const AskPage = ({ kind, id, onOpenFilm, onPlay, onLight }: AskPageProps) => {
  const cache = useQueryClient();
  const found = useQuery({
    ...requestsQueries.askable(kind, id),
    refetchInterval: (query) =>
      query.state.data?.standing.status === 'requested' ? FOLLOWED_EVERY_MS : false,
  });
  const title = found.data ?? null;
  const isElsewhere = title?.standing.status === 'linked';
  const faces = useQuery(linkingQueries.faces());
  const isRequestableKind = useRequestableKinds().has(kind);
  const isAskable =
    isRequestableKind &&
    (title?.standing.status === 'askable' || (isElsewhere && title.standing.requestId === null));
  const seasons = useQuery({
    ...requestsQueries.seriesSeasons(kind === 'series' && title !== null ? Number(id) : null),
  });
  const canRequest =
    kind === 'film'
      ? isAskable
      : isRequestableKind &&
        (seasons.data ?? []).some(
          (season) => season.standing === 'askable' || season.standing === 'partly',
        );
  const offered = useQuery(requestsQueries.profilesOnOffer(kind, canRequest));
  const requestId = title?.standing.requestId ?? null;
  const requests = useQuery({ ...requestsQueries.mediaRequests(), enabled: requestId !== null });
  const request = requests.data?.find((one) => one.id === requestId) ?? null;
  const asMe = useMe();
  const progress = useQuery(requestsQueries.requestProgress(request?.state === 'downloading'));
  const going = request === null ? null : progressOfRequest(request, progress.data ?? []);
  const [chosen, setChosen] = useState<ReadonlySet<number> | null>(null);
  const [followsNew, setFollowsNew] = useState(true);
  const [asking, setAsking] = useState<MediaRequestAsk | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const [isShowingLater, setIsShowingLater] = useState(false);
  const [shownMore, setShownMore] = useState<ReadonlySet<StreamGroupId>>(new Set());
  const mayStream = useMayStream();
  const isStreamable =
    mayStream &&
    onPlay !== undefined &&
    kind === 'film' &&
    title !== null &&
    (title.standing.status === 'askable' ||
      title.standing.status === 'requested' ||
      title.standing.status === 'linked');
  const [device] = useState(() => theTvsProfile());
  const streaming = usePlayFromSource(
    isStreamable ? Number(id) : null,
    screenOfProfile(device, title?.runtimeMinutes ?? null),
    (mediaId) => {
      onPlay?.(mediaId);
    },
  );
  const sourceGroups = groupStreamOffers(streaming.offers.data?.offers ?? [], isShowingLater);

  const backdrop = title?.backdropUrl ?? null;

  useEffect(() => {
    if (!canRequest) {
      setAsking(null);
    }
  }, [canRequest]);

  useEffect(() => {
    onLight(backdrop);
  }, [backdrop, onLight]);

  if (title === null) {
    return (
      <View style={styles.waiting}>
        {found.isPending ? (
          <ActivityIndicator size="large" color={tokens.colours.text} />
        ) : (
          <Text style={styles.problem}>{say('tv.askPage.thisTitleCouldNotBeFound')}</Text>
        )}
      </View>
    );
  }

  const stillToHave = (seasons.data ?? []).filter(
    (season) => season.standing === 'askable' || season.standing === 'partly',
  );
  const picked =
    chosen ??
    new Set(stillToHave.filter((season) => season.season > 0).map((season) => season.season));
  const choices = offered.data?.forcedId === null ? offered.data.choices : [];
  const standing = nameTheStanding(title.standing);
  const mayCancel =
    request !== null &&
    isAskedByMe(request, asMe) &&
    request.state !== 'filed' &&
    request.state !== 'available';
  const starring = title.cast.slice(0, STARRING).map((one) => one.name);
  const whoElse = describeWhoElseAsked(title.standing.askedBy ?? [], asMe);
  const myProfileAsk = request === null ? null : describeMyProfileAsk(request, asMe);
  const isJoinable = isRequestableKind && mayJoinRequest(title.standing, asMe);
  const isOpenable =
    title.standing.status === 'library' && kind === 'film' && title.standing.mediaId !== null;

  const refresh = () => {
    void cache.invalidateQueries({ queryKey: requestsQueries.key });
  };

  const send = (asked: MediaRequestAsk) => {
    setIsBusy(true);
    setProblem(null);

    void askForMedia(asked)
      .then(({ value, refusal }) => {
        if (value === null) {
          setProblem(refusal?.message ?? say('common.thatCouldNotBeRequested'));
          setAsking(null);
          refresh();

          return;
        }

        setAsking(null);
        refresh();
      })
      .finally(() => {
        setIsBusy(false);
      });
  };

  const join = () => {
    if (title.standing.requestId === null) {
      return;
    }

    setIsBusy(true);
    setProblem(null);

    void joinMediaRequest(title.standing.requestId)
      .then(({ refusal }) => {
        setProblem(refusal?.message ?? null);
        refresh();
      })
      .catch(() => {
        setProblem(say('common.thatCouldNotBeRequested'));
      })
      .finally(() => {
        setIsBusy(false);
      });
  };

  const ask = (asked: MediaRequestAsk) => {
    if (choices.length > 1) {
      setAsking(asked);

      return;
    }

    send(asked);
  };

  const cancel = (id: string) => {
    setIsBusy(true);
    setProblem(null);

    void removeMediaRequest(id, true)
      .then((refusal) => {
        if (refusal !== null) {
          setProblem(refusal.message);

          return;
        }

        refresh();
      })
      .finally(() => {
        setIsBusy(false);
      });
  };

  const askToCancel = () => {
    if (requestId === null) {
      return;
    }

    Alert.alert(
      say('common.cancelTitle', { title: title.title }),
      (request === null ? null : describeOthersStillWanting(askersOf(request), asMe)) ??
        say('common.itWillNotBeFetchedAnd'),
      [
        { text: say('common.keepIt'), style: 'cancel' },
        {
          text: say('common.cancelRequest'),
          style: 'destructive',
          onPress: () => {
            cancel(requestId);
          },
        },
      ],
    );
  };

  const toggle = (season: number) => {
    const next = new Set(picked);

    if (next.has(season)) {
      next.delete(season);
    } else {
      next.add(season);
    }

    setChosen(next);
  };

  return (
    <TitleSpread
      mediaId={null}
      name={title.title}
      hasLogo={false}
      stillPath={backdrop}
      facts={joinFacts([
        title.year?.toString(),
        kind === 'series' ? say('common.series') : null,
        title.runtimeMinutes === null ? null : formatDuration(title.runtimeMinutes * 60),
        title.genres.slice(0, 2).join(', '),
      ])}
      badges={[]}
      tagline={
        going === null && title.standing.status !== 'library' ? (standing?.label ?? null) : null
      }
      overview={title.overview}
      credits={[
        ...(starring.length === 0
          ? []
          : [say('common.starringValue', { value: starring.join(', ') })]),
        ...(whoElse === null ? [] : [whoElse]),
        ...(myProfileAsk === null ? [] : [myProfileAsk]),
      ]}
    >
      {going === null ? null : (
        <DownloadPanel label={standing?.label ?? say('common.downloading')} progress={going} />
      )}

      {isStreamable && streaming.isPickerOpen ? (
        <FadeIn isFilling={false}>
          <View style={styles.sources}>
            {streaming.isFailed ? (
              <>
                <Text style={styles.problem}>
                  {say('screens.chooseSourceDialog.couldNotLookForSources')}
                </Text>
                <ActionRow
                  label={say('common.tryAgain')}
                  icon={RotateCw}
                  hasPreferredFocus
                  onPress={streaming.lookAgain}
                />
              </>
            ) : streaming.isLooking ? (
              <View style={styles.looking}>
                <ActivityIndicator color={tokens.colours.text} />
                <Text style={styles.problem}>
                  {say('screens.chooseSourceDialog.lookingForSources')}
                </Text>
              </View>
            ) : sourceGroups.groups.length === 0 ? (
              <>
                <Text style={styles.problem}>
                  {say('screens.chooseSourceDialog.noneOfTheSourcesHaveThis')}
                </Text>
                <ActionRow
                  label={say('common.tryAgain')}
                  icon={RotateCw}
                  hasPreferredFocus
                  onPress={streaming.lookAgain}
                />
              </>
            ) : (
              sourceGroups.groups.map((group, groupAt) => {
                const shown = shownMore.has(group.id)
                  ? group.offers
                  : group.offers.slice(0, MOST_PER_GROUP);

                return (
                  <View key={group.id} style={styles.sources}>
                    <Text style={styles.heading}>{group.heading}</Text>

                    {shown.map((offer, at) => {
                      const { summary, detail } = describeStreamOffer(offer);

                      return (
                        <ActionRow
                          key={offer.id}
                          label={
                            offer.id === streaming.bestId
                              ? `${summary} · ${say('screens.chooseSourceDialog.bestMatch')}`
                              : summary
                          }
                          detail={detail}
                          icon={Play}
                          hasPreferredFocus={groupAt === 0 && at === 0}
                          isDisabled={streaming.isStarting}
                          onPress={() => {
                            streaming.choose(offer.id);
                          }}
                        />
                      );
                    })}

                    {group.offers.length > shown.length ? (
                      <ActionRow
                        label={say('common.showMore')}
                        icon={ChevronDown}
                        onPress={() => {
                          setShownMore(new Set([...shownMore, group.id]));
                        }}
                      />
                    ) : null}
                  </View>
                );
              })
            )}

            {sourceGroups.laterCount > 0 ? (
              <ActionRow
                label={
                  isShowingLater
                    ? say('screens.chooseSourceDialog.hideSourcesThatDownloadFirst')
                    : sayCount(
                        'screens.chooseSourceDialog.count.showSourcesThatDownloadFirst',
                        sourceGroups.laterCount,
                      )
                }
                icon={ChevronDown}
                onPress={() => {
                  setIsShowingLater(!isShowingLater);
                }}
              />
            ) : null}

            <ActionRow
              label={say('common.notNow')}
              icon={X}
              hasPreferredFocus={streaming.isLooking}
              onPress={streaming.closePicker}
            />

            {(streaming.offers.data?.problems ?? []).length === 0 ? null : (
              <Text style={styles.problem}>
                {(streaming.offers.data?.problems ?? []).map((one) => one.message).join(' ')}
              </Text>
            )}
          </View>
        </FadeIn>
      ) : asking !== null && canRequest ? (
        <>
          {choices.map((choice, at) => (
            <ActionRow
              key={choice.id}
              label={say('tv.askPage.requestInName', { name: choice.name })}
              icon={Plus}
              hasPreferredFocus={at === 0}
              onPress={() => {
                if (!isBusy) {
                  send({ ...asking, profileId: choice.id });
                }
              }}
            />
          ))}
          <ActionRow
            label={say('common.notNow')}
            icon={X}
            onPress={() => {
              setAsking(null);
            }}
          />
        </>
      ) : (
        <>
          {title.standing.status === 'library' &&
          kind === 'film' &&
          title.standing.mediaId !== null ? (
            <ActionRow
              label={say('common.open')}
              icon={Play}
              hasPreferredFocus
              onPress={() => {
                if (title.standing.mediaId !== null) {
                  onOpenFilm(title.standing.mediaId);
                }
              }}
            />
          ) : null}

          {isStreamable ? (
            <>
              <ActionRow
                label={
                  streaming.isFinding || streaming.isStarting
                    ? say('common.starting')
                    : say('common.play')
                }
                icon={Play}
                hasPreferredFocus
                onPress={() => {
                  if (!streaming.isFinding && !streaming.isStarting) {
                    streaming.start();
                  }
                }}
              />
              <ActionRow
                label={say('common.sources')}
                icon={ListVideo}
                onPress={streaming.openPicker}
              />
            </>
          ) : null}

          {isElsewhere && kind === 'film' && title.standing.mediaId !== null ? (
            <ActionRow
              label={say('common.watchOnName', {
                name: title.standing.fromServer ?? say('common.linkedServers'),
              })}
              icon={Play}
              hasPreferredFocus={!isStreamable}
              onPress={() => {
                if (title.standing.mediaId !== null) {
                  onOpenFilm(title.standing.mediaId);
                }
              }}
            />
          ) : null}

          {isAskable && kind === 'film' ? (
            <ActionRow
              label={
                isBusy
                  ? say('tv.askPage.requesting')
                  : isElsewhere
                    ? say('common.requestHere')
                    : say('common.request')
              }
              icon={Plus}
              hasPreferredFocus={!isElsewhere && !isStreamable}
              onPress={() => {
                if (!isBusy) {
                  ask(askingFor(title, null, []));
                }
              }}
            />
          ) : null}

          {isAskable && kind === 'film'
            ? (faces.data ?? [])
                .filter((server) => server.takesRequests && server.isReachable)
                .map((server) => (
                  <ActionRow
                    key={server.id}
                    label={say('common.askName', { name: server.name })}
                    icon={Plus}
                    onPress={() => {
                      if (isBusy) {
                        return;
                      }

                      setIsBusy(true);
                      void askLinkedServer(server.id, askingFor(title, null, []))
                        .then((sent) => {
                          setProblem(sent.refusal?.message ?? null);
                        })
                        .finally(() => {
                          setIsBusy(false);
                        });
                    }}
                  />
                ))
            : null}

          {kind === 'series'
            ? (seasons.data ?? []).map((season) => {
                const says = SEASON_SAYS[season.standing];
                const isChoosable = season.standing === 'askable' || season.standing === 'partly';
                const label =
                  season.name === null || season.name === undefined
                    ? sayCount('tv.askPage.seasonEpisodes', season.episodeCount, {
                        season: season.season.toString(),
                      })
                    : sayCount('tv.askPage.courEpisodes', season.episodeCount, {
                        name: season.name,
                      });

                return (
                  <ActionRow
                    key={season.season}
                    label={says === null ? label : `${label} · ${says}`}
                    {...(isChoosable && picked.has(season.season) ? { icon: Check } : {})}
                    onPress={() => {
                      if (isChoosable) {
                        toggle(season.season);
                      }
                    }}
                  />
                );
              })
            : null}

          {kind === 'series' && canRequest && (seasons.data ?? []).length > 0 ? (
            <ActionRow
              label={say('common.getNewSeasonsAsTheyCome')}
              {...(followsNew ? { icon: Check } : {})}
              onPress={() => {
                setFollowsNew(!followsNew);
              }}
            />
          ) : null}

          {kind === 'series' && canRequest && picked.size > 0 ? (
            <ActionRow
              label={
                isBusy
                  ? say('tv.askPage.requesting')
                  : picked.size === 1
                    ? say('tv.askPage.request1Season')
                    : say('tv.askPage.requestSizeSeasons', { size: picked.size.toString() })
              }
              icon={Plus}
              hasPreferredFocus
              onPress={() => {
                if (!isBusy) {
                  ask(
                    askingFor(
                      title,
                      [...picked].sort((left, right) => left - right),
                      [],
                      followsNew,
                    ),
                  );
                }
              }}
            />
          ) : null}

          {isJoinable ? (
            <ActionRow
              label={say('common.iWantThisToo')}
              icon={Plus}
              hasPreferredFocus={!isOpenable && !isStreamable}
              onPress={() => {
                if (!isBusy) {
                  join();
                }
              }}
            />
          ) : null}

          {mayCancel ? (
            <ActionRow
              label={say('common.cancelRequest')}
              icon={X}
              hasPreferredFocus={!isAskable && !isOpenable && !isStreamable}
              onPress={() => {
                if (!isBusy) {
                  askToCancel();
                }
              }}
            />
          ) : null}
        </>
      )}

      {(problem ?? streaming.problem) === null ? null : (
        <Text style={styles.problem}>{problem ?? streaming.problem}</Text>
      )}
    </TitleSpread>
  );
};

AskPage.displayName = 'AskPage';

const styles = StyleSheet.create({
  waiting: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  looking: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  sources: { gap: tokens.space.xs, alignItems: 'flex-start' },
  heading: { color: tokens.colours.muted, fontSize: tokens.type.body, fontWeight: '600' },
  problem: { color: tokens.colours.muted, fontSize: tokens.type.body },
});

export { AskPage };
