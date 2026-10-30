import { FlatList, StyleSheet, Text, View } from 'react-native';
import { FocusGuide } from '@ValenceTv/components/FocusGuide/FocusGuide';
import { RequestCard } from '@ValenceTv/components/RequestCard/RequestCard';
import { tokens } from '@ValenceTv/theme/tokens';
import type { RequestShelfProps } from './RequestShelf.types';

/**
 * One part of the requests list, by what its requests need next, as a shelf of posters under its
 * name. It builds only the cards near the remote, so a long list of requests costs a television's
 * browser no more than a short one, and it sends the remote back to the card it was last on.
 *
 * @param name - What the part is called.
 * @param requests - What is in it, newest first.
 * @param goingOf - How a request's download is going, while it downloads.
 * @param isFirst - Whether it is the first part, whose first card the remote starts on.
 * @param onFocus - Told which request the remote has come to rest on.
 * @param onOpen - Told which request was chosen.
 */
const RequestShelf = ({ name, requests, goingOf, isFirst, onFocus, onOpen }: RequestShelfProps) => (
  <View style={styles.shelf}>
    <Text style={styles.name}>{name}</Text>

    <FocusGuide isRemembering>
      <FlatList
        horizontal
        data={requests}
        keyExtractor={(request) => request.id}
        showsHorizontalScrollIndicator={false}
        initialNumToRender={7}
        windowSize={3}
        style={styles.row}
        contentContainerStyle={styles.inside}
        renderItem={({ item, index }) => (
          <RequestCard
            request={item}
            going={goingOf(item)}
            hasPreferredFocus={isFirst && index === 0}
            onFocus={() => {
              onFocus(item);
            }}
            onPress={onOpen}
          />
        )}
      />
    </FocusGuide>
  </View>
);

RequestShelf.displayName = 'RequestShelf';

const styles = StyleSheet.create({
  shelf: { gap: tokens.space.xs },
  name: {
    color: tokens.colours.text,
    fontSize: tokens.type.body,
    fontWeight: '600',
    paddingLeft: tokens.space.edge,
  },
  row: { overflow: 'hidden' },
  inside: {
    gap: tokens.space.md,
    paddingHorizontal: tokens.space.edge,
    paddingVertical: tokens.space.md,
  },
});

export { RequestShelf };
