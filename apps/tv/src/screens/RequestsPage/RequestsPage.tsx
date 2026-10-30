import { useMe } from '@ValenceClient/requests/useMe';
import { useSettled } from '@ValenceClient/timing/useSettled';
import { isAskedByMe } from '@ValenceContracts/functions/isAskedByMe';
import { isAskedFor } from '@ValenceContracts/functions/isAskedFor';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { artworkUrl } from '@ValenceClient/library/artworkUrl';
import { requestsQueries } from '@ValenceClient/query/requestsQueries';
import { nameTheRequestShelf } from '@ValenceClient/requests/nameTheRequestShelf';
import { progressOfRequest } from '@ValenceClient/requests/progressOfRequest';
import { REQUEST_SHELVES, shelfOfRequest } from '@ValenceClient/requests/shelfOfRequest';
import { EdgeFade } from '@ValenceTv/components/EdgeFade/EdgeFade';
import { tokens } from '@ValenceTv/theme/tokens';
import { RequestHero } from './components/RequestHero/RequestHero';
import { RequestShelf } from './components/RequestShelf/RequestShelf';
import type { MediaRequest } from '@ValenceContracts/schemas/MediaRequest';
import type { RequestsPageProps } from './RequestsPage.types';
import { say } from '@ValenceI18n/say';

const WATCHABLE_KINDS = new Set(['film', 'series']);

const SETTLES_AFTER_MS = 250;

/**
 * Everything that has been asked for — this viewer's own, or everyone's for somebody who approves
 * them — as shelves of posters by what each needs next: approving, finishing, its release, a
 * release to be found, or nothing more, newest first on each. Whatever the remote rests on is
 * written large across the top, with what it is about and how its download is going, over its
 * picture — the library's for a film it holds, or the catalogue's for a programme, whose pictures
 * the library keeps on its episodes, and for what has not arrived — and lights the page, starting
 * on the first, once the remote has settled on it, so running along a shelf does not ask the
 * catalogue about every poster it passes. The list keeps itself up to date while it is open.
 * Choosing one opens its page, to see it whole or cancel it.
 *
 * @param onOpen - Told which request was chosen.
 * @param onLight - Told which picture lights the page.
 */
const RequestsPage = ({ onOpen, onLight }: RequestsPageProps) => {
  const requests = useQuery(requestsQueries.mediaRequests());
  const asMe = useMe();
  const [restingOn, setRestingOn] = useState<MediaRequest | null>(null);

  const shelves = useMemo(() => {
    const shown = (requests.data ?? [])
      .filter((request) => WATCHABLE_KINDS.has(request.kind) && isAskedFor(request))
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt));

    return REQUEST_SHELVES.map((shelf) => ({
      shelf,
      requests: shown.filter((request) => shelfOfRequest(request) === shelf),
    })).filter(({ requests: onIt }) => onIt.length > 0);
  }, [requests.data]);

  const settled = useSettled(restingOn, SETTLES_AFTER_MS);
  const all = shelves.flatMap(({ requests: onIt }) => onIt);
  const lead =
    (settled === null ? undefined : all.find((request) => request.id === settled.id)) ??
    all[0] ??
    null;

  const film = lead?.kind === 'film' ? lead.mediaId : null;
  const catalogue = useQuery(
    requestsQueries.askable(
      lead?.kind ?? 'film',
      lead === null || film !== null || lead.tmdbId === null ? null : lead.tmdbId.toString(),
    ),
  );
  const picture =
    lead === null
      ? null
      : film === null
        ? (catalogue.data?.backdropUrl ?? null)
        : artworkUrl(film, 'backdrop');
  const light = picture ?? lead?.posterUrl ?? null;

  useEffect(() => {
    onLight(light);
  }, [light, onLight]);

  const progress = useQuery(
    requestsQueries.requestProgress(all.some((request) => request.state === 'downloading')),
  );
  const goingOf = (request: MediaRequest) => progressOfRequest(request, progress.data ?? []);

  return (
    <View style={styles.page}>
      <RequestHero
        request={lead}
        going={lead === null ? null : goingOf(lead)}
        isSomeoneElses={lead !== null && asMe !== null && !isAskedByMe(lead, asMe)}
        film={film}
        picture={picture}
        logoPath={film === null ? (catalogue.data?.logoUrl ?? null) : null}
      >
        {requests.isPending ? (
          <ActivityIndicator size="large" color={tokens.colours.text} style={styles.waiting} />
        ) : (
          <View style={styles.empty}>
            <Text style={styles.nothing}>{say('tv.requestsPage.nothingHasBeenAskedForYet')}</Text>
            <Text style={styles.hint}>
              {say('tv.requestsPage.findSomethingInSearchAndRequest')}
            </Text>
          </View>
        )}
      </RequestHero>

      {shelves.length === 0 ? null : (
        <EdgeFade edge="top" reach={0.08} style={styles.shelves}>
          <ScrollView style={styles.shelves} contentContainerStyle={styles.inside}>
            {shelves.map(({ shelf, requests: onIt }, at) => (
              <RequestShelf
                key={shelf}
                name={nameTheRequestShelf(shelf)}
                requests={onIt}
                goingOf={goingOf}
                isFirst={at === 0}
                onFocus={setRestingOn}
                onOpen={onOpen}
              />
            ))}
          </ScrollView>
        </EdgeFade>
      )}
    </View>
  );
};

RequestsPage.displayName = 'RequestsPage';

const styles = StyleSheet.create({
  page: { flex: 1 },
  shelves: { flex: 1 },
  inside: { gap: tokens.space.sm, paddingTop: tokens.space.sm, paddingBottom: tokens.space.xl },
  waiting: { alignSelf: 'flex-start' },
  empty: { gap: tokens.space.xs },
  nothing: { color: tokens.colours.text, fontSize: tokens.type.body },
  hint: { color: tokens.colours.muted, fontSize: tokens.type.small },
});

export { RequestsPage };
