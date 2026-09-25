import { Bin } from '@keyline-icons/react-native';
import { AGroup } from '@ValenceMobile/components/AGroup/AGroup';
import { useMemo } from 'react';
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import { ActivityIndicator, Alert, StyleSheet, View } from 'react-native';
import { formatDuration } from '@ValenceCore/functions/formatDuration';
import { describeReadingPlace } from '@ValenceClient/books/describeReadingPlace';
import { forgetReading } from '@ValenceClient/books/fetchBooks';
import { describeWhen } from '@ValenceClient/history/describeWhen';
import { forgetHistory, forgetViewing } from '@ValenceClient/history/fetchHistory';
import { interleaveHistory } from '@ValenceClient/history/interleaveHistory';
import { bookQueries } from '@ValenceClient/query/bookQueries';
import { viewingQueries } from '@ValenceClient/query/viewingQueries';
import { Button } from '@ValenceMobile/components/Button/Button';
import { Icon } from '@ValenceMobile/components/Icon/Icon';
import { Words } from '@ValenceMobile/components/Words/Words';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import { say } from '@ValenceI18n/say';
import type { BookReading } from '@ValenceContracts/schemas/Book';

const styles = StyleSheet.create({
  forget: { padding: 10 },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  words: { flex: 1, gap: 2 },
});

/**
 * What this viewer has watched and read, newest first, as the web's history panel lists it — a page
 * of viewings at a time, with the books read in the same span among them — and a way to forget any
 * one of it or all of it, the last asked first, since it cannot be undone. Forgetting a book takes
 * it off the shelf of what is being read, too.
 */
const TheHistory = () => {
  const cache = useQueryClient();
  const colours = useTheColours();
  const history = useInfiniteQuery(viewingQueries.history());
  const reading = useQuery(bookQueries.reading());
  const entries = useMemo(
    () =>
      interleaveHistory(history.data?.pages.flat() ?? [], reading.data ?? [], history.hasNextPage),
    [history.data, reading.data, history.hasNextPage],
  );
  const now = new Date();

  const reread = async () => {
    await Promise.all([
      cache.invalidateQueries({ queryKey: viewingQueries.history().queryKey }),
      cache.invalidateQueries({ queryKey: bookQueries.reading().queryKey }),
    ]);
  };

  /**
   * Forgets one book, taking it off the list straight away and putting it back if the server says no.
   *
   * @param bookId - The book.
   */
  const forgetABook = async (bookId: string) => {
    cache.setQueryData(bookQueries.reading().queryKey, (held: BookReading[] | undefined) =>
      held?.filter((one) => one.book.id !== bookId),
    );

    if (!(await forgetReading(bookId))) {
      await cache.invalidateQueries({ queryKey: bookQueries.reading().queryKey });
    }
  };

  const forgetEverything = () => {
    Alert.alert(
      say('phone.theHistory.forgetEverythingTitle'),
      say('phone.theHistory.forgetEverythingBody'),
      [
        { text: say('phone.theHistory.keepIt'), style: 'cancel' },
        {
          text: say('phone.theHistory.forgetEverything'),
          style: 'destructive',
          onPress: () => {
            void Promise.all([forgetHistory(), forgetReading()]).then(reread);
          },
        },
      ],
    );
  };

  if (history.isPending || reading.isPending) {
    return <ActivityIndicator color={colours.textMuted} />;
  }

  if (history.isError) {
    return <Words tone="danger">{say('phone.theHistory.couldNotRead')}</Words>;
  }

  if (entries.length === 0) {
    return <Words tone="muted">{say('phone.theHistory.empty')}</Words>;
  }

  return (
    <>
      {entries.length === 0 ? null : (
        <AGroup title={say('phone.theHistory.heading')}>
          {entries.map((entry) => {
            const name =
              entry.kind === 'reading'
                ? entry.reading.book.title
                : entry.viewing.seriesTitle === null
                  ? (entry.viewing.title ?? say('phone.theHistory.something'))
                  : `${entry.viewing.seriesTitle} — ${entry.viewing.title ?? ''}`;
            const said =
              entry.kind === 'reading'
                ? [
                    describeWhen(entry.at, now),
                    entry.reading.isFinished
                      ? say('phone.theHistory.finished')
                      : describeReadingPlace(entry.reading),
                  ]
                : [
                    describeWhen(entry.at, now),
                    say('phone.theHistory.watched', {
                      duration: formatDuration(entry.viewing.secondsWatched),
                    }),
                    entry.viewing.isFinished ? say('phone.theHistory.finished') : null,
                  ];

            return (
              <View
                key={entry.kind === 'reading' ? `book-${entry.reading.book.id}` : entry.viewing.id}
                style={styles.row}
              >
                <View style={styles.words}>
                  <Words lines={2}>{name}</Words>
                  <Words size="small" tone="muted">
                    {said.filter((part) => part !== null).join(' · ')}
                  </Words>
                </View>

                <Button
                  tone="bare"
                  label={say('phone.theHistory.forgetWho', { name })}
                  onPress={() => {
                    if (entry.kind === 'reading') {
                      void forgetABook(entry.reading.book.id);

                      return;
                    }

                    void forgetViewing(entry.viewing.id).then(reread);
                  }}
                >
                  <View style={styles.forget}>
                    <Icon of={Bin} size={18} colour={colours.textMuted} />
                  </View>
                </Button>
              </View>
            );
          })}
        </AGroup>
      )}

      {history.hasNextPage ? (
        <Button
          tone="quiet"
          isBusy={history.isFetchingNextPage}
          onPress={() => {
            void history.fetchNextPage();
          }}
        >
          {say('phone.theHistory.showMore')}
        </Button>
      ) : (
        <Words size="small" tone="muted">
          {say('phone.theHistory.forgottenAfterAYear')}
        </Words>
      )}

      <Button tone="quiet" onPress={forgetEverything}>
        {say('phone.theHistory.forgetEverything')}
      </Button>
    </>
  );
};

TheHistory.displayName = 'TheHistory';

export { TheHistory };
