import { useMemo } from 'react';
import { FlatList, StyleSheet, Text, TVFocusGuideView, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { requestsQueries } from '@ValenceClient/query/requestsQueries';
import { sessionQueries } from '@ValenceClient/query/sessionQueries';
import { progressOfRequest } from '@ValenceClient/requests/progressOfRequest';
import { tokens } from '@ValenceTv/theme/tokens';
import { RequestCard } from '@ValenceTv/screens/Account/components/RequestCard/RequestCard';
import type { YourRequestsProps } from './YourRequests.types';

const WATCHABLE_KINDS = new Set(['film', 'series']);

const AT_MOST = 12;

/**
 * This viewer's own most recent requests, as a row of posters on their profile, each saying where it
 * stands and, while it downloads, how far through it is. Nothing is drawn where they have asked for
 * nothing. The row catches the remote across the whole width of the page.
 *
 * @param onOpen - Told which request was chosen.
 * @param onFocus - Told when the remote comes onto the row.
 */
const YourRequests = ({ onOpen, onFocus }: YourRequestsProps) => {
  const requests = useQuery(requestsQueries.mediaRequests());
  const me = useQuery(sessionQueries.who());

  const mine = useMemo(
    () =>
      (requests.data ?? [])
        .filter(
          (request) => WATCHABLE_KINDS.has(request.kind) && request.requestedBy.id === me.data?.id,
        )
        .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
        .slice(0, AT_MOST),
    [requests.data, me.data?.id],
  );

  const progress = useQuery(
    requestsQueries.requestProgress(mine.some((request) => request.state === 'downloading')),
  );

  if (mine.length === 0) {
    return null;
  }

  return (
    <View style={styles.section}>
      <Text style={styles.heading}>Your requests</Text>

      <TVFocusGuideView autoFocus>
        <FlatList
          horizontal
          data={mine}
          keyExtractor={(request) => request.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.inside}
          style={styles.row}
          renderItem={({ item }) => (
            <RequestCard
              request={item}
              going={progressOfRequest(item, progress.data ?? [])}
              onPress={onOpen}
              onFocus={onFocus}
            />
          )}
        />
      </TVFocusGuideView>
    </View>
  );
};

YourRequests.displayName = 'YourRequests';

const styles = StyleSheet.create({
  section: { alignSelf: 'stretch', gap: tokens.space.xs, marginTop: tokens.space.lg },
  heading: {
    color: tokens.colours.text,
    fontSize: tokens.type.body,
    fontWeight: '600',
    paddingHorizontal: tokens.space.edge,
  },
  row: { overflow: 'visible' },
  inside: {
    paddingHorizontal: tokens.space.edge,
    paddingVertical: tokens.space.md,
    gap: tokens.space.md,
  },
});

export { YourRequests };
