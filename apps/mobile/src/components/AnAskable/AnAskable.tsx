import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ActivityIndicator, Alert, Image, StyleSheet } from 'react-native';
import { requestsQueries } from '@ValenceClient/query/requestsQueries';
import { sessionQueries } from '@ValenceClient/query/sessionQueries';
import { askForMedia, removeMediaRequest } from '@ValenceClient/requests/fetchMediaRequests';
import { describeAskableFacts } from '@ValenceClient/requests/describeAskableFacts';
import { describeStanding } from '@ValenceClient/requests/describeStanding';
import { progressOfRequest } from '@ValenceClient/requests/progressOfRequest';
import { Button } from '@ValenceMobile/components/Button/Button';
import { HowFar } from '@ValenceMobile/components/HowFar/HowFar';
import { Screen } from '@ValenceMobile/components/Screen/Screen';
import { SegmentedRow } from '@ValenceMobile/components/SegmentedRow/SegmentedRow';
import { Words } from '@ValenceMobile/components/Words/Words';
import { TheSeasons } from '@ValenceMobile/components/AnAskable/components/TheSeasons/TheSeasons';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import type { AnAskableProps } from './AnAskable.types';

const WHILE_IT_MOVES = 5000;

const HAS_ARRIVED: ReadonlySet<string> = new Set(['filed', 'available']);

const styles = StyleSheet.create({
  backdrop: { aspectRatio: 16 / 9, borderRadius: 14, width: '100%' },
});

/**
 * A film or programme from the catalogue: what it is, whether it is here or asked for, and the way
 * to ask for it.
 *
 * A programme is asked for a season at a time, or every season. Where the server offers more than
 * one quality somebody picks one before asking; where it offers one, or insists on one, there is
 * nothing to pick.
 *
 * Somebody can take back their own request until it has arrived, and is asked first, because it
 * throws away whatever has downloaded.
 *
 * @param kind - Whether it is a film or a programme.
 * @param id - Its catalogue id.
 * @param onOpen - Told to open it in the library, which a title already there is at once, in
 *   place of this page — it is never asked about.
 * @param onBack - Told somebody is done with it.
 */
const AnAskable = ({ kind, id, onOpen, onBack }: AnAskableProps) => {
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
  const [seasons, setSeasons] = useState<number[] | null>(null);
  const [quality, setQuality] = useState<string | null>(null);
  const [refusal, setRefusal] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const title = asking.data;
  const heldAs =
    title !== undefined && title.standing.status === 'library' ? title.standing.mediaId : null;

  useEffect(() => {
    if (heldAs !== null) {
      onOpen(kind, heldAs);
    }
  }, [heldAs, kind, onOpen]);
  const request = (requests.data ?? []).find((one) => one.id === title?.standing.requestId) ?? null;
  const progress = useQuery(requestsQueries.requestProgress(request?.state === 'downloading'));
  const going = request === null ? null : progressOfRequest(request, progress.data ?? []);
  const choices = offered.data?.forcedId === null ? offered.data.choices : [];
  const needsQuality = choices.length > 1 && quality === null;

  const send = async () => {
    setIsSending(true);
    setRefusal(null);

    const sent = await askForMedia({
      kind,
      tmdbId: Number(id),
      ...(kind === 'series' ? { seasons } : {}),
      ...(quality === null ? {} : { profileId: quality }),
    });

    setIsSending(false);
    setRefusal(sent.refusal?.message ?? null);
    await cache.invalidateQueries({ queryKey: requestsQueries.key });
  };

  const takeBack = (requestId: string) => {
    Alert.alert('Cancel this request?', 'Anything already downloaded for it is deleted.', [
      { text: 'Keep it', style: 'cancel' },
      {
        text: 'Cancel request',
        style: 'destructive',
        onPress: () => {
          void removeMediaRequest(requestId, true).then(async (refused) => {
            setRefusal(refused?.message ?? null);
            await cache.invalidateQueries({ queryKey: requestsQueries.key });
          });
        },
      },
    ]);
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
        <Words tone="danger">That title could not be read.</Words>
      </Screen>
    );
  }

  const standing = describeStanding(title.standing);
  const mayTakeBack =
    request !== null && request.requestedBy.id === who.data?.id && !HAS_ARRIVED.has(request.state);

  return (
    <Screen scrolls onBack={onBack}>
      {title.backdropUrl === null ? null : (
        <Image
          style={[styles.backdrop, { backgroundColor: colours.surfaceRaised }]}
          source={{ uri: title.backdropUrl }}
          accessibilityIgnoresInvertColors
        />
      )}

      <Words size="title">{title.title}</Words>

      <Words tone="muted">{describeAskableFacts(title)}</Words>

      {standing === null ? null : (
        <Words tone={standing.tone === 'danger' ? 'danger' : 'accent'}>{standing.label}</Words>
      )}

      {going === null ? null : (
        <HowFar fraction={going.progress} label={`How far ${title.title} has downloaded`} />
      )}

      {title.standing.status === 'askable' ? (
        <>
          {kind === 'series' ? (
            <TheSeasons tmdbId={Number(id)} seasons={seasons} onChange={setSeasons} />
          ) : null}

          {choices.length > 1 ? (
            <SegmentedRow
              label="Quality"
              items={choices.map((choice) => ({ id: choice.id, label: choice.name }))}
              value={quality}
              onSelect={setQuality}
            />
          ) : null}

          <Button
            isBusy={isSending}
            isDisabled={needsQuality || (seasons !== null && seasons.length === 0)}
            onPress={() => {
              void send();
            }}
          >
            Request
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
          Cancel request
        </Button>
      ) : null}

      {title.overview === null ? null : <Words tone="muted">{title.overview}</Words>}
    </Screen>
  );
};

AnAskable.displayName = 'AnAskable';

export { AnAskable };
