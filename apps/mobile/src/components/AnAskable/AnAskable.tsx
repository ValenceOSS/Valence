import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { ARemotePicture } from '@ValenceMobile/components/ARemotePicture/ARemotePicture';
import { requestsQueries } from '@ValenceClient/query/requestsQueries';
import { sessionQueries } from '@ValenceClient/query/sessionQueries';
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
import { isAskedBy } from '@ValenceContracts/functions/isAskedBy';
import { seasonsWithItemsOf } from '@ValenceClient/requests/seasonsWithItemsOf';
import { useRequestableKinds } from '@ValenceClient/requests/useRequestableKinds';
import { describeAskableFacts } from '@ValenceClient/requests/describeAskableFacts';
import { describeStanding } from '@ValenceClient/requests/describeStanding';
import { progressOfRequest } from '@ValenceClient/requests/progressOfRequest';
import { describeDownloadLine } from '@ValenceClient/requests/describeDownloadLine';
import { Button } from '@ValenceMobile/components/Button/Button';
import { HowFar } from '@ValenceMobile/components/HowFar/HowFar';
import { Screen } from '@ValenceMobile/components/Screen/Screen';
import { SegmentedRow } from '@ValenceMobile/components/SegmentedRow/SegmentedRow';
import { Words } from '@ValenceMobile/components/Words/Words';
import { TheSeasons } from '@ValenceMobile/components/AnAskable/components/TheSeasons/TheSeasons';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import { askLinkedServer } from '@ValenceClient/linking/askLinkedServer';
import { linkingQueries } from '@ValenceClient/query/linkingQueries';
import type { AnAskableProps } from './AnAskable.types';
import { say } from '@ValenceI18n/say';

const WHILE_IT_MOVES = 5000;

const HAS_ARRIVED: ReadonlySet<string> = new Set(['filed', 'available']);

const styles = StyleSheet.create({
  backdrop: { aspectRatio: 16 / 9, borderRadius: 14, width: '100%' },
});

/**
 * A film or programme from the catalogue: what it is, whether it is here or asked for, and the way
 * to ask for it.
 *
 * A programme is asked for a season at a time, or every season, and whether new seasons come too;
 * one already asked for can have more seasons added. Where the server offers more than
 * one quality somebody picks one before asking; where it offers one, or insists on one, there is
 * nothing to pick.
 *
 * Somebody else's request names who asked and can be wanted too. Somebody can take back their own
 * request until it has arrived, and is asked first, because it throws away whatever has downloaded —
 * unless others want it too, when it stays for them.
 *
 * @param kind - Whether it is a film or a programme.
 * @param id - Its catalogue id.
 * @param isMore - Whether it is a programme the library holds some of, opened to ask for more of
 *   it: its seasons are offered, those held whole locked, in place of opening it in the library.
 * @param onOpen - Told to open it in the library, which a title already there is at once, in
 *   place of this page — it is never asked about, unless more of it is being asked for.
 * @param onBack - Told somebody is done with it.
 */
const AnAskable = ({ kind, id, isMore = false, onOpen, onBack }: AnAskableProps) => {
  const cache = useQueryClient();
  const colours = useTheColours();
  const asking = useQuery({
    ...requestsQueries.askable(kind, id),
    refetchInterval: (query) =>
      query.state.data?.standing.status === 'requested' ? WHILE_IT_MOVES : false,
  });
  const requests = useQuery(requestsQueries.mediaRequests());
  const offered = useQuery(requestsQueries.profilesOnOffer(kind));
  const who = useQuery(sessionQueries.who());
  const kinds = useRequestableKinds();
  const [seasons, setSeasons] = useState<number[] | null>(null);
  const [followsNew, setFollowsNew] = useState(true);
  const [adding, setAdding] = useState<number[] | null>([]);
  const [addsFollowing, setAddsFollowing] = useState(false);
  const [quality, setQuality] = useState<string | null>(null);
  const [refusal, setRefusal] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const faces = useQuery(linkingQueries.faces());
  const title = asking.data;
  const heldAs =
    !isMore && title !== undefined && title.standing.status === 'library'
      ? title.standing.mediaId
      : null;

  useEffect(() => {
    if (heldAs !== null) {
      onOpen(kind, heldAs);
    }
  }, [heldAs, kind, onOpen]);
  const request = (requests.data ?? []).find((one) => one.id === title?.standing.requestId) ?? null;
  const progress = useQuery(requestsQueries.requestProgress(request?.state === 'downloading'));
  const going = request === null ? null : progressOfRequest(request, progress.data ?? []);
  const saidOfGoing = going === null ? null : describeDownloadLine(going);
  const choices = offered.data?.forcedId === null ? offered.data.choices : [];
  const needsQuality = choices.length > 1 && quality === null;

  const isUnrequestable = !kinds.has(kind);
  const isAddingSeasons =
    !isUnrequestable &&
    kind === 'series' &&
    title?.standing.status === 'requested' &&
    request !== null &&
    request.approval !== 'refused';
  const askedSeasons =
    request === null ? [] : (request.seasons ?? seasonsWithItemsOf(request.items));
  const isFollowedAlready =
    request !== null && (request.seasons === null || request.followsNewSeasons);
  const hasMoreToAdd =
    adding === null || adding.length > 0 || (addsFollowing && !isFollowedAlready);

  const send = async () => {
    setIsSending(true);
    setRefusal(null);

    const sent = await askForMedia({
      kind,
      tmdbId: Number(id),
      ...(kind === 'series' ? { seasons, followsNewSeasons: followsNew } : {}),
      ...(quality === null ? {} : { profileId: quality }),
    });

    setIsSending(false);
    setRefusal(sent.refusal?.message ?? null);
    await cache.invalidateQueries({ queryKey: requestsQueries.key });
  };

  const addSeasons = async () => {
    setIsSending(true);
    setRefusal(null);

    const sent = await askForMedia({
      kind: 'series',
      tmdbId: Number(id),
      seasons: adding,
      followsNewSeasons: addsFollowing,
    });

    setIsSending(false);
    setRefusal(sent.refusal?.message ?? null);

    if (sent.refusal === null) {
      setAdding([]);
      setAddsFollowing(false);
    }

    await cache.invalidateQueries({ queryKey: requestsQueries.key });
  };

  const join = async () => {
    if (title?.standing.requestId === null || title?.standing.requestId === undefined) {
      return;
    }

    setIsSending(true);
    setRefusal(null);

    const sent = await joinMediaRequest(title.standing.requestId);

    setIsSending(false);
    setRefusal(sent.refusal?.message ?? null);
    await cache.invalidateQueries({ queryKey: requestsQueries.key });
  };

  const takeBack = (requestId: string) => {
    Alert.alert(
      say('common.cancelThisRequest'),
      (request === null ? null : describeOthersStillWanting(askersOf(request), who.data?.id)) ??
        say('phone.anAskable.anythingAlreadyDownloadedForItIs'),
      [
        { text: say('common.keepIt'), style: 'cancel' },
        {
          text: say('common.cancelRequest'),
          style: 'destructive',
          onPress: () => {
            void removeMediaRequest(requestId, true).then(async (refused) => {
              setRefusal(refused?.message ?? null);
              await cache.invalidateQueries({ queryKey: requestsQueries.key });
            });
          },
        },
      ],
    );
  };

  if (asking.isPending) {
    return (
      <Screen centres onBack={onBack}>
        <ActivityIndicator color={colours.textMuted} />
      </Screen>
    );
  }

  if (title === undefined) {
    return (
      <Screen centres onBack={onBack}>
        <Words tone="danger">{say('common.thatTitleCouldNotBeRead')}</Words>
      </Screen>
    );
  }

  const standing = describeStanding(title.standing);
  const mayTakeBack =
    request !== null && isAskedBy(request, who.data?.id) && !HAS_ARRIVED.has(request.state);
  const whoElse = describeWhoElseAsked(title.standing.askedBy ?? [], who.data?.id);
  const myProfileAsk = request === null ? null : describeMyProfileAsk(request, who.data?.id);
  const isJoinable = !isUnrequestable && mayJoinRequest(title.standing, who.data?.id);

  return (
    <Screen scrolls onBack={onBack}>
      {title.backdropUrl === null ? null : (
        <ARemotePicture
          style={[styles.backdrop, { backgroundColor: colours.surfaceRaised }]}
          uri={title.backdropUrl}
        />
      )}

      <Words size="title">{title.title}</Words>

      <Words tone="muted">{describeAskableFacts(title)}</Words>

      {standing === null ? null : (
        <Words tone={standing.tone === 'danger' ? 'danger' : 'accent'}>{standing.label}</Words>
      )}

      {whoElse === null ? null : <Words tone="muted">{whoElse}</Words>}

      {myProfileAsk === null ? null : <Words tone="muted">{myProfileAsk}</Words>}

      {isJoinable ? (
        <Button
          isBusy={isSending}
          onPress={() => {
            void join();
          }}
        >
          {say('common.iWantThisToo')}
        </Button>
      ) : null}

      {going === null ? null : (
        <HowFar
          fraction={going.progress}
          label={say('common.howFarTitleHasDownloaded', { title: title.title })}
        />
      )}

      {saidOfGoing === null ? null : (
        <Words size="small" tone="muted">
          {saidOfGoing}
        </Words>
      )}

      {title.standing.status === 'linked' && title.standing.mediaId !== null ? (
        <Button
          onPress={() => {
            if (title.standing.mediaId !== null) {
              onOpen(kind, title.standing.mediaId);
            }
          }}
        >
          {say('common.watchOnName', {
            name: title.standing.fromServer ?? say('common.linkedServers'),
          })}
        </Button>
      ) : null}

      {isUnrequestable && title.standing.status === 'askable' ? (
        <Words tone="muted">{say('common.noLibraryTakesRequestsForThis')}</Words>
      ) : null}

      {!isUnrequestable &&
      (title.standing.status === 'askable' ||
        (isMore && title.standing.status === 'library') ||
        (title.standing.status === 'linked' && title.standing.requestId === null)) ? (
        <>
          {kind === 'series' ? (
            <TheSeasons
              tmdbId={Number(id)}
              seasons={seasons}
              onChange={setSeasons}
              followsNew={followsNew}
              onFollowsNew={setFollowsNew}
            />
          ) : null}

          {choices.length > 1 ? (
            <SegmentedRow
              label={say('common.quality')}
              items={choices.map((choice) => ({ id: choice.id, label: choice.name }))}
              value={quality}
              onSelect={setQuality}
            />
          ) : null}

          <Button
            isBusy={isSending}
            isDisabled={needsQuality || (seasons !== null && seasons.length === 0)}
            {...(title.standing.status === 'linked' ? { tone: 'quiet' as const } : {})}
            onPress={() => {
              void send();
            }}
          >
            {title.standing.status === 'linked' ? say('common.requestHere') : say('common.request')}
          </Button>

          {(faces.data ?? [])
            .filter((server) => server.takesRequests && server.isReachable)
            .map((server) => (
              <Button
                key={server.id}
                tone="quiet"
                isBusy={isSending}
                onPress={() => {
                  setIsSending(true);
                  void askLinkedServer(server.id, {
                    kind,
                    tmdbId: Number(id),
                    ...(kind === 'series' ? { seasons, followsNewSeasons: followsNew } : {}),
                  })
                    .then((sent) => {
                      setRefusal(sent.refusal?.message ?? null);
                    })
                    .finally(() => {
                      setIsSending(false);
                    });
                }}
              >
                {say('common.askName', { name: server.name })}
              </Button>
            ))}
        </>
      ) : null}

      {isAddingSeasons ? (
        <>
          <TheSeasons
            tmdbId={Number(id)}
            seasons={adding}
            onChange={setAdding}
            followsNew={addsFollowing}
            onFollowsNew={setAddsFollowing}
            alreadyAsked={askedSeasons}
            isFollowedAlready={isFollowedAlready}
          />

          <Button
            isBusy={isSending}
            isDisabled={!hasMoreToAdd}
            onPress={() => {
              void addSeasons();
            }}
          >
            {say('common.addSeasons')}
          </Button>
        </>
      ) : null}

      {refusal === null ? null : <Words tone="danger">{refusal}</Words>}

      {mayTakeBack ? (
        <Button
          tone="quiet"
          onPress={() => {
            takeBack(request.id);
          }}
        >
          {say('common.cancelRequest')}
        </Button>
      ) : null}

      {title.overview === null ? null : <Words tone="muted">{title.overview}</Words>}
    </Screen>
  );
};

AnAskable.displayName = 'AnAskable';

export { AnAskable };
