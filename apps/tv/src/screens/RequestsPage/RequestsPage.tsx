import { useEffect, useMemo } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { requestsQueries } from '@ValenceClient/query/requestsQueries';
import { sessionQueries } from '@ValenceClient/query/sessionQueries';
import { progressOfRequest } from '@ValenceClient/requests/progressOfRequest';
import { tokens } from '@ValenceTv/theme/tokens';
import { RequestRow } from './components/RequestRow/RequestRow';
import type { RequestsPageProps } from './RequestsPage.types';

const WATCHABLE_KINDS = new Set(['film', 'series']);

/**
 * Everything that has been asked for — this viewer's own, or everyone's for somebody who approves
 * them — newest first, each saying where it has got to and, while it downloads, how far through it
 * is. The list keeps itself up to date while it is open. Choosing one opens its page, to see it
 * whole or cancel it.
 *
 * @param onOpen - Told which request was chosen.
 * @param onLight - Told which picture lights the page: the newest request's poster.
 */
const RequestsPage = ({ onOpen, onLight }: RequestsPageProps) => {
  const requests = useQuery(requestsQueries.mediaRequests());
  const me = useQuery(sessionQueries.who());

  const shown = useMemo(
    () =>
      (requests.data ?? [])
        .filter((request) => WATCHABLE_KINDS.has(request.kind))
        .sort((left, right) => right.createdAt.localeCompare(left.createdAt)),
    [requests.data],
  );

  const lead = shown[0]?.posterUrl ?? null;

  useEffect(() => {
    onLight(lead);
  }, [lead, onLight]);

  const progress = useQuery(
    requestsQueries.requestProgress(shown.some((request) => request.state === 'downloading')),
  );

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.inside}>
      <Text style={styles.heading}>Requests</Text>

      {requests.isPending ? (
        <ActivityIndicator size="large" color={tokens.colours.text} />
      ) : shown.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.nothing}>Nothing has been asked for yet.</Text>
          <Text style={styles.hint}>Find something in Search, and request it from its page.</Text>
        </View>
      ) : (
        shown.map((request, at) => (
          <RequestRow
            key={request.id}
            request={request}
            going={progressOfRequest(request, progress.data ?? [])}
            isSomeoneElses={me.data !== undefined && request.requestedBy.id !== me.data?.id}
            hasPreferredFocus={at === 0}
            onPress={onOpen}
          />
        ))
      )}
    </ScrollView>
  );
};

RequestsPage.displayName = 'RequestsPage';

const styles = StyleSheet.create({
  page: { flex: 1 },
  inside: {
    paddingHorizontal: tokens.space.edge,
    paddingTop: tokens.space.xl + tokens.space.lg,
    paddingBottom: tokens.space.xl,
    gap: tokens.space.sm,
  },
  heading: {
    color: tokens.colours.text,
    fontSize: tokens.type.title,
    fontWeight: '700',
    marginBottom: tokens.space.md,
  },
  empty: { gap: tokens.space.xs },
  nothing: { color: tokens.colours.text, fontSize: tokens.type.body },
  hint: { color: tokens.colours.muted, fontSize: tokens.type.small },
});

export { RequestsPage };
