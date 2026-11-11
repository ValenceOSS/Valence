import { useQuery } from '@tanstack/react-query';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { describePersonFacts } from '@ValenceClient/people/describePersonFacts';
import { libraryQueries } from '@ValenceClient/query/libraryQueries';
import { requestsQueries } from '@ValenceClient/query/requestsQueries';
import { useWhatIMayDo } from '@ValenceClient/session/useWhatIMayDo';
import { ACard } from '@ValenceMobile/components/ACard/ACard';
import { ACardPart } from '@ValenceMobile/components/ACardPart/ACardPart';
import { ACatalogueCard } from '@ValenceMobile/components/ACatalogueCard/ACatalogueCard';
import { AnOverview } from '@ValenceMobile/components/AnOverview/AnOverview';
import { APersonFacts } from '@ValenceMobile/components/APerson/components/APersonFacts/APersonFacts';
import { APersonHead } from '@ValenceMobile/components/APerson/components/APersonHead/APersonHead';
import { APersonTimeline } from '@ValenceMobile/components/APerson/components/APersonTimeline/APersonTimeline';
import { ARemotePicture } from '@ValenceMobile/components/ARemotePicture/ARemotePicture';
import { ARising } from '@ValenceMobile/components/ARising/ARising';
import { AShelf } from '@ValenceMobile/components/AShelf/AShelf';
import { ASpinner } from '@ValenceMobile/components/ASpinner/ASpinner';
import { ATintedGround } from '@ValenceMobile/components/ATintedGround/ATintedGround';
import { Screen } from '@ValenceMobile/components/Screen/Screen';
import { Words } from '@ValenceMobile/components/Words/Words';
import { useIsOpenedOut } from '@ValenceMobile/hooks/useIsOpenedOut';
import { usePictureTint } from '@ValenceMobile/hooks/usePictureTint';
import { GROUND } from '@ValenceMobile/theme/GROUND';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import type { CatalogueTitle, PersonCredit } from '@ValenceContracts/schemas/CatalogueTitle';
import type { APersonProps } from './APerson.types';
import { say } from '@ValenceI18n/say';

const NO_WORK: readonly CatalogueTitle[] = [];

const NO_CREDITS: readonly PersonCredit[] = [];

const ASIDE_SHARE = 0.34;

const PORTRAIT_TALL = 4 / 3;

const CARD_WIDE = 132;

const styles = StyleSheet.create({
  aside: { gap: 20 },
  beside: { alignItems: 'flex-start', flexDirection: 'row', gap: 32, paddingTop: 12 },
  name: { alignItems: 'center' },
  part: { gap: 10 },
  portrait: { borderRadius: 18 },
  reading: { flex: 1, gap: 20 },
});

/**
 * Somebody who appears in the library, as the web's page about them lays them out: what the
 * catalogue says about them — what they are known for, how many credits they have, how old they are
 * and where they were born, and their Instagram — their biography, everything of theirs on this
 * server a row each for films, programmes and episodes, the rest of their work for whoever may ask
 * for it, and every credit they have, newest first.
 *
 * On a phone held as phones are, their portrait runs edge to edge with their name over it, and
 * everything else follows down the page. On the open inside of a folding phone, which has the room
 * the web does, the portrait stands as a card at the left with their name and what is known about
 * them beneath it, and the rest beside it.
 *
 * @param personId - Who.
 * @param onLookAt - Told to open a title.
 * @param onLookAtShow - Told to open a programme.
 * @param onAsk - Told to open a title that is not here, for whoever may ask for things.
 * @param onBack - Told somebody is done with them.
 */
const APerson = ({ personId, onLookAt, onLookAtShow, onAsk, onBack }: APersonProps) => {
  const colours = useTheColours();
  const { width } = useWindowDimensions();
  const isOpenedOut = useIsOpenedOut();
  const { may } = useWhatIMayDo();
  const askFor = may('requests.ask') ? onAsk : undefined;
  const person = useQuery(libraryQueries.person(personId));
  const credits = useQuery(libraryQueries.credits(personId));
  const catalogued = useQuery(requestsQueries.personWork(personId, askFor !== undefined));
  const who = person.data ?? null;
  const portraitUrl = who?.portraitUrl ?? null;
  const tint = usePictureTint(portraitUrl);

  if (person.isPending) {
    return (
      <Screen centres onBack={onBack}>
        <ASpinner colour={colours.textMuted} />
      </Screen>
    );
  }

  const name = who?.name ?? say('common.somebody');
  const films = credits.data?.films ?? [];
  const shows = credits.data?.shows ?? [];
  const episodes = credits.data?.episodes ?? [];
  const work = catalogued.data?.titles ?? NO_WORK;
  const timeline = catalogued.data?.timeline ?? NO_CREDITS;
  const facts = describePersonFacts(who, timeline.length);
  const biography = who?.biography ?? null;
  const notHeld = work.filter(
    (title) => title.standing.status !== 'library' && title.standing.status !== 'linked',
  );
  const held = [
    { title: say('common.films'), items: films, asProgramme: false, isStill: false },
    { title: say('common.programmes'), items: shows, asProgramme: true, isStill: false },
    { title: say('common.episodes'), items: episodes, asProgramme: false, isStill: true },
  ].filter((shelf) => shelf.items.length > 0);
  const toAskFor = [
    {
      title: films.length === 0 ? say('common.films') : say('screens.personDialog.moreFilms'),
      items: notHeld.filter((title) => title.kind === 'film'),
    },
    {
      title: shows.length === 0 ? say('common.programmes') : say('screens.personDialog.moreShows'),
      items: notHeld.filter((title) => title.kind === 'series'),
    },
  ].filter((shelf) => shelf.items.length > 0);
  const isBeside = isOpenedOut && portraitUrl !== null;
  const asideWide = width * ASIDE_SHARE;
  const about = <APersonFacts facts={facts} instagram={who?.instagram ?? null} />;

  const reading = (
    <>
      <View style={styles.part}>
        <Words size="lead" isStrong>
          {say('screens.personDialog.biography')}
        </Words>
        {biography === null ? (
          <Words tone="muted">{say('screens.personDialog.noBiographyProvided')}</Words>
        ) : (
          <AnOverview>{biography}</AnOverview>
        )}
      </View>

      {held.map((shelf) => (
        <ACardPart key={shelf.title}>
          <AShelf title={shelf.title}>
            {shelf.items.map((media) => (
              <ACard
                key={media.id}
                media={media}
                asProgramme={shelf.asProgramme}
                isStill={shelf.isStill}
                onLookAt={onLookAt}
                onLookAtShow={onLookAtShow}
              />
            ))}
          </AShelf>
        </ACardPart>
      ))}

      {askFor === undefined
        ? null
        : toAskFor.map((shelf) => (
            <ACardPart key={shelf.title}>
              <AShelf title={shelf.title}>
                {shelf.items.map((title) => (
                  <ACatalogueCard key={title.id} title={title} onAsk={askFor} wide={CARD_WIDE} />
                ))}
              </AShelf>
            </ACardPart>
          ))}

      <APersonTimeline credits={timeline} {...(askFor === undefined ? {} : { onAsk: askFor })} />
    </>
  );

  return (
    <GROUND.Provider value={tint}>
      <Screen
        scrolls
        title={name}
        onBack={onBack}
        {...(portraitUrl === null || isBeside
          ? {}
          : {
              head: (
                <APersonHead
                  portraitUrl={portraitUrl}
                  name={name}
                  ground={tint ?? colours.surface}
                />
              ),
            })}
        {...(tint === null ? {} : { behind: <ATintedGround tint={tint} /> })}
      >
        {isBeside ? (
          <ARising>
            <View style={styles.beside}>
              <View style={[styles.aside, { width: asideWide }]}>
                <ARemotePicture
                  style={[styles.portrait, { height: asideWide * PORTRAIT_TALL, width: asideWide }]}
                  uri={portraitUrl}
                  label={name}
                />
                <Words size="title">{name}</Words>
                {about}
              </View>
              <View style={styles.reading}>{reading}</View>
            </View>
          </ARising>
        ) : (
          <>
            {portraitUrl === null ? (
              <ARising>
                <View style={styles.name}>
                  <Words size="title" isCentred>
                    {name}
                  </Words>
                </View>
              </ARising>
            ) : null}
            <ARising>{about}</ARising>
            <ARising turn={1}>
              <View style={styles.reading}>{reading}</View>
            </ARising>
          </>
        )}
      </Screen>
    </GROUND.Provider>
  );
};

APerson.displayName = 'APerson';

export { APerson };
