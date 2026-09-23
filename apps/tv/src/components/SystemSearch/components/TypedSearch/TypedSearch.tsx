import { StyleSheet, View } from 'react-native';
import { TextField } from '@ValenceTv/components/TextField/TextField';
import { tokens } from '@ValenceTv/theme/tokens';
import type { SystemSearchProps } from '@ValenceTv/components/SystemSearch/SystemSearch.types';

/**
 * Search where the television has no search screen of its own for an app to put its results in, as
 * on Android TV: a search box across the top — pressing it brings up the television's keyboard, with
 * its voice typing — and the results beneath, measured for however much room they are left. The box
 * takes the remote first, as a system's search screen does.
 *
 * @param placeholder - What the search box says while empty.
 * @param onChangeText - Told what has been typed, each time it changes.
 * @param onResultsLayout - Told how much room the results have.
 * @param children - The results.
 */
const TypedSearch = ({
  placeholder,
  onChangeText,
  onResultsLayout,
  children,
}: Omit<SystemSearchProps, 'upTo'>) => (
  <View style={styles.page}>
    <View style={styles.box}>
      <TextField
        label={placeholder}
        value=""
        placeholder={placeholder}
        hasPreferredFocus
        onChange={onChangeText}
        onSubmit={() => undefined}
      />
    </View>

    <View
      testID="search-results"
      style={styles.page}
      onLayout={(event) => {
        const { width, height } = event.nativeEvent.layout;

        onResultsLayout({ width, height });
      }}
    >
      {children}
    </View>
  </View>
);

const styles = StyleSheet.create({
  page: { flex: 1 },
  box: { paddingHorizontal: tokens.space.edge, paddingTop: tokens.space.edge },
});

TypedSearch.displayName = 'TypedSearch';

export { TypedSearch };
