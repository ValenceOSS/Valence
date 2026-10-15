import { useMe } from '@ValenceClient/requests/useMe';
import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, StyleSheet, View } from 'react-native';
import { ARemotePicture } from '@ValenceMobile/components/ARemotePicture/ARemotePicture';
import { requestsQueries } from '@ValenceClient/query/requestsQueries';
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
import { askingFor } from '@ValenceClient/requests/askingFor';
import { Toggle } from '@ValenceMobile/components/Toggle/Toggle';
import { groupReleases } from '@ValenceClient/requests/groupReleases';
import { RELEASE_TYPE_NAMES } from '@ValenceClient/requests/RELEASE_TYPE_NAMES';
import {
  BOOK_FORMATS,
  DEFAULT_RELEASE_TYPES,
  RELEASE_TYPES,
} from '@ValenceContracts/schemas/MediaRequest';
import { AManyChoices } from '@ValenceMobile/components/AManyChoices/AManyChoices';
import { pictureOnThisServer } from '@ValenceMobile/platform/pictureOnThisServer';
import { TheTracks } from '@ValenceMobile/components/AnAskable/components/TheTracks/TheTracks';
import type { BookFormat, ReleaseType } from '@ValenceContracts/schemas/MediaRequest';
import { linkingQueries } from '@ValenceClient/query/linkingQueries';
import type { AnAskableProps } from './AnAskable.types';
import { say } from '@ValenceI18n/say';
import { ASpinner } from '@ValenceMobile/components/ASpinner/ASpinner';

const WHILE_IT_MOVES = 5000;

const HAS_ARRIVED: ReadonlySet<string> = new Set(['filed', 'available']);

const BOOK_FORMAT_NAMES: Record<BookFormat, string> = {
  ebook: say('common.ebook'),
  audiobook: say('common.audiobook'),
};

const styles = StyleSheet.create({
  backdrop: { aspectRatio: 16 / 9, borderRadius: 14, width: '100%' },
  cover: { alignSelf: 'center', aspectRatio: 1, borderRadius: 14, width: '62%' },
  release: { gap: 2, paddingVertical: 8 },
  releases: { gap: 4 },
});

/**
 * Whether a kind of request is one the library opens as a film or programme.
 *
 * @param kind - The kind.
 * @returns Whether it is a film or a programme.
 */
const isWatched = (kind: string): kind is 'film' | 'series' => kind === 'film' || kind === 'series';

/**
 * Something from the catalogue — a film, a programme, an artist, an album or a book: what it is,
 * whether it is here or asked for, and the way to ask for it.
 *
 * A programme is asked for a season at a time, or every season, and whether new seasons come too;
 * one already asked for can have more seasons added. Where the server offers more than
 * one quality somebody picks one before asking; where it offers one, or insists on one, there is
 * nothing to pick. An artist is asked for with the kinds of release to follow, and lists its albums
 * to ask for one alone; an album lists its songs; a book is asked for as an ebook, an audiobook or
 * both.
 *
 * Somebody else's request names who asked and can be wanted too. Somebody can take back their own
 * request until it has arrived, and is asked first, because it throws away whatever has downloaded —
 * unless others want it too, when it stays for them.
 *
 * @param kind - Whether it is a film, a programme, an artist, an album or a book.
 * @param id - Its catalogue id.
 * @param isMore - Whether it is a programme the library holds some of, opened to ask for more of
 *   it: its seasons are offered, those held whole locked, in place of opening it in the library.
 * @param onOpen - Told to open it in the library, which a title already there is at once, in
 *   place of this page — it is never asked about, unless more of it is being asked for.
 * @param onAskAbout - Told to open one of an artist's albums to ask for, where that can be done.
 * @param onBack - Told somebody is done with it.
 */
const AnAskable = ({ kind, id, isMore = false, onOpen, onAskAbout, onBack }: AnAskableProps) => {
  const cache = useQueryClient();
  const colours = useTheColours();
  const asking = useQuery({
    ...requestsQueries.askable(kind, id),
    refetchInterval: (query) =>
      query.state.data?.standing.status === 'requested' ? WHILE_IT_MOVES : false,
  });
  const requests = useQuery(requestsQueries.mediaRequests());
  const offered = useQuery(requestsQueries.profilesOnOffer(kind));
  const me = useMe();
  const kinds = useRequestableKinds();
  const [seasons, setSeasons] = useState<number[] | null>(null);
  const [followsNew, setFollowsNew] = useState(true);
  const [adding, setAdding] = useState<number[] | null>([]);
  const [addsFollowing, setAddsFollowing] = useState(false);
  const [quality, setQuality] = useState<string | null>(null);
  const [releaseTypes, setReleaseTypes] = useState<ReleaseType[]>([...DEFAULT_RELEASE_TYPES]);
  const [bookFormats, setBookFormats] = useState<BookFormat[]>(['ebook']);
  const [isWholeSeries, setIsWholeSeries] = useState(false);
  const [isOverviewWhole, setIsOverviewWhole] = useState(false);
  const [refusal, setRefusal] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const faces = useQuery(linkingQueries.faces());
  const title = asking.data;
  const heldAs =
    !isMore && title !== undefined && title.standing.status === 'library'
      ? title.standing.mediaId
      : null;

  useEffect(() => {
    if (heldAs !== null && isWatched(kind)) {
      onOpen(kind, heldAs);
    }
  }, [heldAs, kind, onOpen]);
  const request = (requests.data ?? []).find((one) => one.id === title?.standing.requestId) ?? null;
  const progress = useQuery(requestsQueries.requestProgress(request?.state === 'downloading'));
  const going = request === null ? null : progressOfRequest(request, progress.data ?? []);
  const saidOfGoing = going === null ? null : describeDownloadLine(going);
  const choices = offered.data?.forcedId === null ? offered.data.choices : [];
  const needsQuality = choices.length > 1 && quality === null;
  const needsMore =
    (kind === 'artist' && releaseTypes.length === 0) ||
    (kind === 'book' && bookFormats.length === 0);

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

    if (title === undefined) {
      setIsSending(false);

      return;
    }

    const sent = await askForMedia({
      ...askingFor(title, seasons, releaseTypes, followsNew, bookFormats, isWholeSeries),
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

    try {
      const sent = await joinMediaRequest(title.standing.requestId);

      setRefusal(sent.refusal?.message ?? null);
      await cache.invalidateQueries({ queryKey: requestsQueries.key });
    } catch {
      setRefusal(say('common.thatCouldNotBeRequested'));
    } finally {
      setIsSending(false);
    }
  };

  const takeBack = (requestId: string) => {
    Alert.alert(
      say('common.cancelThisRequest'),
      (request === null ? null : describeOthersStillWanting(askersOf(request), me)) ??
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
        <ASpinner colour={colours.textMuted} />
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
    request !== null && isAskedByMe(request, me) && !HAS_ARRIVED.has(request.state);
  const whoElse = describeWhoElseAsked(title.standing.askedBy ?? [], me);
  const myProfileAsk = request === null ? null : describeMyProfileAsk(request, me);
  const isJoinable = !isUnrequestable && mayJoinRequest(title.standing, me);

  return (
    <Screen scrolls onBack={onBack}>
      {title.backdropUrl !== null ? (
        <ARemotePicture
          style={[styles.backdrop, { backgroundColor: colours.surfaceRaised }]}
          uri={pictureOnThisServer(title.backdropUrl)}
        />
      ) : title.posterUrl !== null && !isWatched(kind) ? (
        <ARemotePicture
          style={[styles.cover, { backgroundColor: colours.surfaceRaised }]}
          uri={pictureOnThisServer(title.posterUrl)}
        />
      ) : null}

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

      {title.standing.status === 'linked' && title.standing.mediaId !== null && isWatched(kind) ? (
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
          ) : kind === 'artist' ? (
            <AManyChoices
              label={say('screens.releaseTypeChooser.whichReleases')}
              choices={RELEASE_TYPES.map((type) => ({
                id: type,
                label: RELEASE_TYPE_NAMES[type].label,
              }))}
              chosen={releaseTypes}
              onChange={(chosen) => {
                setReleaseTypes(RELEASE_TYPES.filter((type) => chosen.includes(type)));
              }}
            />
          ) : kind === 'book' ? (
            <AManyChoices
              label={say('screens.bookFormatChooser.whichFormats')}
              choices={BOOK_FORMATS.map((format) => ({
                id: format,
                label: BOOK_FORMAT_NAMES[format],
              }))}
              chosen={bookFormats}
              onChange={(chosen) => {
                setBookFormats(BOOK_FORMATS.filter((format) => chosen.includes(format)));
              }}
            />
          ) : null}

          {kind === 'book' && title.series !== null && title.series !== undefined ? (
            <Toggle
              label={say('screens.askableDialog.everyBookInSeries', { series: title.series.name })}
              isOn={isWholeSeries}
              onToggle={setIsWholeSeries}
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
            isDisabled={needsQuality || needsMore || (seasons !== null && seasons.length === 0)}
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
                  void askLinkedServer(
                    server.id,
                    askingFor(title, seasons, releaseTypes, followsNew, bookFormats, isWholeSeries),
                  )
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

      {title.overview === null ? null : (
        <Button
          tone="bare"
          label={say('common.readMore')}
          onPress={() => {
            setIsOverviewWhole((was) => !was);
          }}
        >
          <Words tone="muted" {...(isOverviewWhole ? {} : { lines: 6 })}>
            {title.overview}
          </Words>
        </Button>
      )}

      {title.tracks.length === 0 ? null : <TheTracks tracks={title.tracks} label={title.label} />}

      {groupReleases(title.albums).map((group) => (
        <View key={group.id} style={styles.releases}>
          <Words size="heading">{group.title}</Words>

          {group.albums.map((album) => (
            <Button
              key={album.id}
              tone="bare"
              label={album.title}
              onPress={() => {
                onAskAbout?.('album', album.id);
              }}
            >
              <View style={styles.release}>
                <Words>{album.title}</Words>
                {album.firstReleased === null ? null : (
                  <Words size="small" tone="muted">
                    {album.firstReleased.slice(0, 4)}
                  </Words>
                )}
              </View>
            </Button>
          ))}
        </View>
      ))}
    </Screen>
  );
};

AnAskable.displayName = 'AnAskable';

export { AnAskable };
