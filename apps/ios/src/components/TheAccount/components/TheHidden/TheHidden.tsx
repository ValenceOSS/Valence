import { Eye } from '@keyline-icons/react-native';
import { useQuery } from '@tanstack/react-query';
import { StyleSheet, View } from 'react-native';
import { saidWhen } from '@ValenceClient/format/saidWhen';
import { useHidden } from '@ValenceClient/library/useHidden';
import { librariesToHide } from '@ValenceClient/library/librariesToHide';
import { useWatchingProfile } from '@ValenceClient/profiles/useWatchingProfile';
import { libraryQueries } from '@ValenceClient/query/libraryQueries';
import { AGroup } from '@ValencePhone/components/AGroup/AGroup';
import { Button } from '@ValencePhone/components/Button/Button';
import { Icon } from '@ValencePhone/components/Icon/Icon';
import { Toggle } from '@ValencePhone/components/Toggle/Toggle';
import { Words } from '@ValencePhone/components/Words/Words';
import { useConfirmHiding } from '@ValencePhone/hooks/useConfirmHiding';
import { useTheColours } from '@ValencePhone/theme/useTheColours';

const styles = StyleSheet.create({
  bringBack: { padding: 6 },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    minHeight: 52,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  words: { flex: 1, gap: 2 },
});

/**
 * What this viewer has taken out of their own browsing, each with a way to bring it back, and a
 * switch for each whole library — hiding one asked first, as hiding anything is.
 */
const TheHidden = () => {
  const colours = useTheColours();
  const watching = useWatchingProfile();
  const hiding = useHidden(watching);
  const libraries = librariesToHide(useQuery(libraryQueries.all()).data ?? [], hiding.entries);
  const titles = hiding.entries.filter((entry) => entry.kind !== 'library');

  useConfirmHiding(hiding);

  return (
    <>
      <Words tone="muted">
        Things you have taken out of your own browsing. Anything here can be brought back.
      </Words>

      <AGroup title="Whole libraries">
        {libraries.map((library) => {
          const isHidden = hiding.isHidden({ kind: 'library', subjectId: library.id });

          return (
            <View key={library.id} style={styles.row}>
              <View style={styles.words}>
                <Words>{library.name}</Words>
              </View>

              <Toggle
                label={`Show the ${library.name} library`}
                isOn={!isHidden}
                onToggle={(isOn) => {
                  if (isOn) {
                    hiding.show({ kind: 'library', subjectId: library.id });
                  } else {
                    hiding.askLibrary(library.id, library.name);
                  }
                }}
              />
            </View>
          );
        })}
      </AGroup>

      <AGroup title="Titles and programmes">
        {titles.length === 0 ? (
          <View style={styles.row}>
            <Words tone="muted">Nothing hidden.</Words>
          </View>
        ) : (
          titles.map((entry) => (
            <View key={`${entry.kind}:${entry.subjectId}`} style={styles.row}>
              <View style={styles.words}>
                <Words lines={2}>{entry.title}</Words>
                <Words size="small" tone="muted">
                  {`Hidden ${saidWhen(entry.hiddenAt)}`}
                </Words>
              </View>

              <Button
                tone="bare"
                label={`Bring ${entry.title} back`}
                onPress={() => {
                  hiding.show({ kind: entry.kind, subjectId: entry.subjectId });
                }}
              >
                <View style={styles.bringBack}>
                  <Icon of={Eye} size={18} colour={colours.textMuted} />
                </View>
              </Button>
            </View>
          ))
        )}
      </AGroup>
    </>
  );
};

TheHidden.displayName = 'TheHidden';

export { TheHidden };
