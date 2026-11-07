import { User } from '@keyline-icons/react-native';
import { Star as StarFilled } from '@keyline-icons/react-native/fill';
import { useQuery } from '@tanstack/react-query';
import { StyleSheet, View } from 'react-native';
import { requestsQueries } from '@ValenceClient/query/requestsQueries';
import { ABadgeRow } from '@ValenceMobile/components/ABadgeRow/ABadgeRow';
import { ACatalogueCard } from '@ValenceMobile/components/ACatalogueCard/ACatalogueCard';
import { AHairline } from '@ValenceMobile/components/AHairline/AHairline';
import { AnOverview } from '@ValenceMobile/components/AnOverview/AnOverview';
import { ARemotePicture } from '@ValenceMobile/components/ARemotePicture/ARemotePicture';
import { AShelf } from '@ValenceMobile/components/AShelf/AShelf';
import { Icon } from '@ValenceMobile/components/Icon/Icon';
import { Words } from '@ValenceMobile/components/Words/Words';
import { pictureOnThisServer } from '@ValenceMobile/platform/pictureOnThisServer';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import { STAR_LIT } from '@ValenceMobile/theme/STAR_LIT';
import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';
import type { ABookAboutProps } from './ABookAbout.types';

const MOST_SUBJECTS = 6;

const CARD_WIDE = 120;

const styles = StyleSheet.create({
  author: { flexDirection: 'row', gap: 16 },
  authorSaid: { flex: 1, gap: 2, justifyContent: 'center' },
  fact: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    flexBasis: '47%',
    flexGrow: 1,
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  facts: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  photo: {
    alignItems: 'center',
    aspectRatio: 2 / 3,
    borderRadius: 12,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 96,
  },
  rating: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  section: { gap: 12 },
  whole: { gap: 24 },
});

/**
 * Everything Open Library knows of a book, as the web's book dialog sets it out: how readers rated
 * it and how many have read it, what it is about, when it was first published, who published it,
 * the languages it is in and how long it is, what it is filed under, who wrote it, more by them and
 * books like it.
 *
 * @param title - The book's title, to find it by.
 * @param author - Who wrote it, to find it by, where that is known.
 * @param overview - What the library or the catalogue already says it is about, said in place of
 *   Open Library's.
 * @param subjects - What it is filed under, where Open Library does not say.
 * @param onAsk - Told to open a book from the shelves to ask for; without it, there are no shelves.
 */
const ABookAbout = ({ title, author, overview, subjects = [], onAsk }: ABookAboutProps) => {
  const colours = useTheColours();
  const about = useQuery(requestsQueries.bookAbout(title, author, true));
  const known = about.data ?? null;
  const said = overview ?? known?.overview ?? null;
  const filed = (known === null || known.subjects.length === 0 ? subjects : known.subjects).slice(
    0,
    MOST_SUBJECTS,
  );
  const facts =
    known === null
      ? []
      : [
          known.firstPublished === null
            ? null
            : {
                label: say('screens.bookDialog.firstPublished'),
                value: known.firstPublished.toString(),
              },
          known.publishers[0] === undefined
            ? null
            : { label: say('screens.bookDialog.publisher'), value: known.publishers[0] },
          known.languages.length === 0
            ? null
            : { label: say('common.language'), value: known.languages.join(', ') },
          known.pages === null
            ? null
            : { label: say('common.pages'), value: known.pages.toString() },
        ].filter((fact) => fact !== null);
  const readers = known?.readers ?? null;
  const writer = known?.author ?? null;
  const lived =
    writer === null || writer.born === null
      ? null
      : writer.died === null
        ? say('screens.bookDialog.bornOn', { date: writer.born })
        : say('screens.bookDialog.livedFromTo', { born: writer.born, died: writer.died });

  return (
    <View style={styles.whole}>
      {known === null || known.rating === null ? null : (
        <View style={styles.rating}>
          <Icon of={StarFilled} size={16} colour={STAR_LIT} />
          <Words isStrong>
            {say('screens.bookDialog.ratingOutOfFive', { rating: known.rating.average.toFixed(1) })}
          </Words>
          <Words tone="muted">
            {[
              sayCount('screens.bookDialog.count.ratings', known.rating.count),
              readers === null
                ? null
                : sayCount('screens.bookDialog.count.haveRead', readers.haveRead),
              readers === null
                ? null
                : sayCount('screens.bookDialog.count.wantToRead', readers.wantToRead),
            ]
              .filter((part) => part !== null)
              .join(' · ')}
          </Words>
        </View>
      )}

      {said === null ? (
        about.isPending ? null : (
          <Words tone="muted">{say('screens.bookDialog.nothingIsWrittenAboutThisBook')}</Words>
        )
      ) : (
        <AnOverview>{said}</AnOverview>
      )}

      {facts.length === 0 ? null : (
        <View style={styles.facts}>
          {facts.map((fact) => (
            <View key={fact.label} style={[styles.fact, { borderColor: colours.border }]}>
              <Words size="small" tone="muted">
                {fact.label}
              </Words>
              <Words isStrong lines={2}>
                {fact.value}
              </Words>
            </View>
          ))}
        </View>
      )}

      {filed.length === 0 ? null : (
        <ABadgeRow
          badges={filed.map((subject) => ({ label: subject, tone: 'solid' as const }))}
          isLarge
        />
      )}

      {writer === null ? null : (
        <>
          <AHairline />
          <View style={styles.section}>
            <Words size="heading">{say('screens.bookDialog.aboutTheAuthor')}</Words>
            <View style={styles.author}>
              <View style={[styles.photo, { backgroundColor: colours.surfaceRaised }]}>
                {writer.photoUrl === null ? (
                  <Icon of={User} size={32} colour={colours.textMuted} />
                ) : (
                  <ARemotePicture
                    style={StyleSheet.absoluteFill}
                    uri={pictureOnThisServer(writer.photoUrl)}
                  />
                )}
              </View>
              <View style={styles.authorSaid}>
                <Words size="lead" isStrong>
                  {writer.name}
                </Words>
                {[
                  lived,
                  writer.workCount === null
                    ? null
                    : sayCount('common.count.books', writer.workCount),
                ]
                  .filter((part) => part !== null)
                  .map((part) => (
                    <Words key={part} size="small" tone="muted">
                      {part}
                    </Words>
                  ))}
              </View>
            </View>
            {writer.bio === null ? null : <AnOverview>{writer.bio}</AnOverview>}
          </View>
        </>
      )}

      {known === null || onAsk === undefined || known.byAuthor.length === 0 ? null : (
        <AShelf
          title={say('screens.bookDialog.moreByName', { name: writer?.name ?? author ?? '' })}
        >
          {known.byAuthor.map((one) => (
            <ACatalogueCard key={one.id} title={one} onAsk={onAsk} wide={CARD_WIDE} />
          ))}
        </AShelf>
      )}

      {known === null || onAsk === undefined || known.alike.length === 0 ? null : (
        <AShelf title={say('screens.bookDialog.booksLikeThis')}>
          {known.alike.map((one) => (
            <ACatalogueCard key={one.id} title={one} onAsk={onAsk} wide={CARD_WIDE} />
          ))}
        </AShelf>
      )}

      {known === null ? null : (
        <Words size="small" tone="muted">
          {say('screens.bookDialog.fromOpenLibrary')}
        </Words>
      )}
    </View>
  );
};

ABookAbout.displayName = 'ABookAbout';

export { ABookAbout };
