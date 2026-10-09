import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Plus, X } from '@keyline-icons/react-native';
import { Play } from '@keyline-icons/react-native/fill';
import { requestsQueries } from '@ValenceClient/query/requestsQueries';
import { sessionQueries } from '@ValenceClient/query/sessionQueries';
import { askingFor } from '@ValenceClient/requests/askingFor';
import {
  askForMedia,
  joinMediaRequest,
  removeMediaRequest,
} from '@ValenceClient/requests/fetchMediaRequests';
import { describeOthersStillWanting } from '@ValenceClient/requests/describeOthersStillWanting';
import { describeWhoElseAsked } from '@ValenceClient/requests/describeWhoElseAsked';
import { mayJoinRequest } from '@ValenceClient/requests/mayJoinRequest';
import { askersOf } from '@ValenceContracts/functions/askersOf';
import { isAskedBy } from '@ValenceContracts/functions/isAskedBy';
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
import type { AskPageProps } from './AskPage.types';
import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';

const FOLLOWED_EVERY_MS = 5000;

const STARRING = 4;

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
 * @param kind - Whether it is a film or a show.
 * @param id - Its number in the film database.
 * @param onOpenFilm - Told to open a film the library has, by its library id.
 * @param onLight - Told which picture lights the page.
 */
const AskPage = ({ kind, id, onOpenFilm, onLight }: AskPageProps) => {
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
  const me = useQuery(sessionQueries.who());
  const progress = useQuery(requestsQueries.requestProgress(request?.state === 'downloading'));
  const going = request === null ? null : progressOfRequest(request, progress.data ?? []);
  const [chosen, setChosen] = useState<ReadonlySet<number> | null>(null);
  const [followsNew, setFollowsNew] = useState(true);
  const [asking, setAsking] = useState<MediaRequestAsk | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

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
    isAskedBy(request, me.data?.id) &&
    request.state !== 'filed' &&
    request.state !== 'available';
  const starring = title.cast.slice(0, STARRING).map((one) => one.name);
  const whoElse = describeWhoElseAsked(title.standing.askedBy ?? [], me.data?.id);
  const isJoinable = isRequestableKind && mayJoinRequest(title.standing, me.data?.id);
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
      (request === null ? null : describeOthersStillWanting(askersOf(request), me.data?.id)) ??
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
      ]}
    >
      {going === null ? null : (
        <DownloadPanel label={standing?.label ?? say('common.downloading')} progress={going} />
      )}

      {asking !== null && canRequest ? (
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

          {isElsewhere && kind === 'film' && title.standing.mediaId !== null ? (
            <ActionRow
              label={say('common.watchOnName', {
                name: title.standing.fromServer ?? say('common.linkedServers'),
              })}
              icon={Play}
              hasPreferredFocus
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
              hasPreferredFocus={!isElsewhere}
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
                const label = sayCount('tv.askPage.seasonEpisodes', season.episodeCount, {
                  season: season.season.toString(),
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
              hasPreferredFocus={!isOpenable}
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
              hasPreferredFocus={!isAskable && !isOpenable}
              onPress={() => {
                if (!isBusy) {
                  askToCancel();
                }
              }}
            />
          ) : null}
        </>
      )}

      {problem === null ? null : <Text style={styles.problem}>{problem}</Text>}
    </TitleSpread>
  );
};

AskPage.displayName = 'AskPage';

const styles = StyleSheet.create({
  waiting: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  problem: { color: tokens.colours.muted, fontSize: tokens.type.body },
});

export { AskPage };
