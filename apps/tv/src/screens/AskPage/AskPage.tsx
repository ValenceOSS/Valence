import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Plus, X } from '@keyline-icons/react-native';
import { Play } from '@keyline-icons/react-native/fill';
import { requestsQueries } from '@ValenceClient/query/requestsQueries';
import { sessionQueries } from '@ValenceClient/query/sessionQueries';
import { askingFor } from '@ValenceClient/requests/askingFor';
import { askForMedia, removeMediaRequest } from '@ValenceClient/requests/fetchMediaRequests';
import { nameTheStanding } from '@ValenceClient/requests/nameTheStanding';
import { progressOfRequest } from '@ValenceClient/requests/progressOfRequest';
import { formatDuration } from '@ValenceCore/functions/formatDuration';
import { ActionRow } from '@ValenceTv/components/ActionRow/ActionRow';
import { DownloadPanel } from '@ValenceTv/components/DownloadPanel/DownloadPanel';
import { TitleSpread } from '@ValenceTv/components/TitleSpread/TitleSpread';
import { joinFacts } from '@ValenceTv/library/joinFacts';
import { tokens } from '@ValenceTv/theme/tokens';
import type { CatalogueSeason, MediaRequestAsk } from '@ValenceContracts/schemas/MediaRequest';
import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';
import type { StringKey } from '@ValenceI18n/StringKey';
import type { AskPageProps } from './AskPage.types';

const FOLLOWED_EVERY_MS = 5000;

const STARRING = 4;

const SEASON_SAYS: Record<CatalogueSeason['standing'], StringKey | null> = {
  askable: null,
  partly: 'tv.askPage.partlyHere',
  requested: 'tv.askPage.requested',
  library: 'tv.askPage.inTheLibrary',
};

/**
 * The page of a film or show the library does not have — or does, or has been asked for — laid out
 * as a title's own page is: its picture, what it is, who is in it and where it stands, above what
 * can be done about it.
 *
 * A film is asked for as it is. A show lists its seasons, every one still to be had chosen to start
 * with, and asks for those chosen. Where this viewer may pick the quality it is fetched in, asking
 * first lists the qualities on offer. A film already in the library opens its own page. Somebody's
 * own request can be cancelled until it is in the library; while something is on its way, the page
 * keeps looking for where it has got to, and while it downloads gives it a panel of its own saying
 * how far through it is, how fast it is arriving and how long is left. The page is lit by the title's own picture.
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
  const isAskable = title?.standing.status === 'askable';
  const seasons = useQuery({
    ...requestsQueries.seriesSeasons(kind === 'series' && title !== null ? Number(id) : null),
  });
  const canRequest =
    kind === 'film'
      ? isAskable
      : (seasons.data ?? []).some(
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
          <Text style={styles.problem}>{say('tv.askPage.notFound')}</Text>
        )}
      </View>
    );
  }

  const stillToHave = (seasons.data ?? []).filter(
    (season) => season.standing === 'askable' || season.standing === 'partly',
  );
  const picked = chosen ?? new Set(stillToHave.map((season) => season.season));
  const choices = offered.data?.forcedId === null ? offered.data.choices : [];
  const standing = nameTheStanding(title.standing);
  const mayCancel =
    request !== null &&
    request.requestedBy.id === me.data?.id &&
    request.state !== 'filed' &&
    request.state !== 'available';
  const starring = title.cast.slice(0, STARRING).map((one) => one.name);
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
          setProblem(refusal?.message ?? say('tv.askPage.couldNotRequest'));
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

  const ask = (asked: MediaRequestAsk) => {
    if (choices.length > 1) {
      setAsking(asked);

      return;
    }

    send(asked);
  };

  const cancel = () => {
    if (requestId === null) {
      return;
    }

    setIsBusy(true);
    setProblem(null);

    void removeMediaRequest(requestId, true)
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
        kind === 'series' ? say('tv.askPage.series') : null,
        title.runtimeMinutes === null ? null : formatDuration(title.runtimeMinutes * 60),
        title.genres.slice(0, 2).join(', '),
      ])}
      badges={[]}
      tagline={
        going === null && title.standing.status !== 'library' ? (standing?.label ?? null) : null
      }
      overview={title.overview}
      credits={
        starring.length === 0
          ? []
          : [say('tv.titleSpread.starring', { names: starring.join(', ') })]
      }
    >
      {going === null ? null : (
        <DownloadPanel
          label={standing?.label ?? say('tv.requests.downloadingToLibrary')}
          progress={going}
        />
      )}

      {asking !== null && canRequest ? (
        <>
          {choices.map((choice, at) => (
            <ActionRow
              key={choice.id}
              label={say('tv.askPage.requestIn', { quality: choice.name })}
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
            label={say('tv.askPage.notNow')}
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
              label={say('tv.askPage.open')}
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
              label={isBusy ? say('tv.askPage.requesting') : say('tv.askPage.request')}
              icon={Plus}
              hasPreferredFocus
              onPress={() => {
                if (!isBusy) {
                  ask(askingFor(title, null, []));
                }
              }}
            />
          ) : null}

          {kind === 'series'
            ? (seasons.data ?? []).map((season) => {
                const saysKey = SEASON_SAYS[season.standing];
                const isChoosable = season.standing === 'askable' || season.standing === 'partly';
                const label = sayCount('tv.askPage.seasonLine', season.episodeCount, {
                  season: season.season,
                });

                return (
                  <ActionRow
                    key={season.season}
                    label={
                      saysKey === null
                        ? label
                        : say('tv.askPage.seasonWithStanding', {
                            season: label,
                            standing: say(saysKey),
                          })
                    }
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

          {kind === 'series' && picked.size > 0 ? (
            <ActionRow
              label={
                isBusy
                  ? say('tv.askPage.requesting')
                  : sayCount('tv.askPage.requestSeasons', picked.size)
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
                    ),
                  );
                }
              }}
            />
          ) : null}

          {mayCancel ? (
            <ActionRow
              label={say('tv.askPage.cancelRequest')}
              icon={X}
              hasPreferredFocus={!isAskable && !isOpenable}
              onPress={() => {
                if (!isBusy) {
                  cancel();
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
