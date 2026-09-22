import { useQuery } from '@tanstack/react-query';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { requestsQueries } from '@ValenceClient/query/requestsQueries';
import { Words } from '@ValencePhone/components/Words/Words';
import { ACatalogueCard } from '@ValencePhone/components/ACatalogueCard/ACatalogueCard';
import { useTheColours } from '@ValencePhone/theme/useTheColours';
import type { FoundProps } from './Found.types';

const styles = StyleSheet.create({
  shelf: { flexDirection: 'row', flexWrap: 'wrap', gap: 18 },
});

/**
 * Films and programmes the catalogue has under what somebody typed, whether or not this server has
 * them yet.
 *
 * @param asked - What they typed.
 * @param onAsk - Told which title somebody wants to see.
 */
const Found = ({ asked, onAsk }: FoundProps) => {
  const films = useQuery(requestsQueries.askableSearch(asked, 'film'));
  const programmes = useQuery(requestsQueries.askableSearch(asked, 'series'));
  const colours = useTheColours();
  const found = [...(films.data ?? []), ...(programmes.data ?? [])];

  if (films.isPending || programmes.isPending) {
    return <ActivityIndicator color={colours.textMuted} />;
  }

  if (films.isError && programmes.isError) {
    return <Words tone="danger">That search did not work.</Words>;
  }

  if (found.length === 0) {
    return <Words tone="muted">Nothing called that.</Words>;
  }

  return (
    <View style={styles.shelf}>
      {found.map((title) => (
        <ACatalogueCard key={`${title.kind}:${title.id}`} title={title} onAsk={onAsk} />
      ))}
    </View>
  );
};

Found.displayName = 'Found';

export { Found };
