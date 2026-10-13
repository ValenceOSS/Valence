import { useQueries } from '@tanstack/react-query';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { ARemotePicture } from '@ValenceMobile/components/ARemotePicture/ARemotePicture';
import { AScrim } from '@ValenceMobile/components/AScrim/AScrim';
import { Button } from '@ValenceMobile/components/Button/Button';
import { FONTS } from '@ValenceMobile/theme/FONTS';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import { onThisServer } from '@ValenceMobile/platform/onThisServer';
import { requestsQueries } from '@ValenceClient/query/requestsQueries';
import type { CatalogueBrowseKind } from '@ValenceContracts/schemas/CatalogueTitle';
import type { ADiscoverHeroProps } from './ADiscoverHero.types';
import { say } from '@ValenceI18n/say';

const SIDE = 20;

const GAP = 12;

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderRadius: 10,
    color: '#ffffff',
    fontFamily: FONTS.sans.semibold,
    fontSize: 12,
    overflow: 'hidden',
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  card: { borderRadius: 22, overflow: 'hidden' },
  dot: { borderRadius: 3, height: 6, width: 6 },
  dots: { flexDirection: 'row', gap: 6, justifyContent: 'center', paddingTop: 12 },
  facts: { color: 'rgba(255, 255, 255, 0.82)', fontFamily: FONTS.sans.semibold, fontSize: 13 },
  logo: { height: 70, width: '72%' },
  overview: {
    color: 'rgba(255, 255, 255, 0.86)',
    fontFamily: FONTS.body.regular,
    fontSize: 14,
    lineHeight: 19,
  },
  picture: { bottom: 0, left: 0, position: 'absolute', right: 0, top: 0 },
  said: { bottom: 0, gap: 10, left: 0, padding: 20, position: 'absolute', right: 0 },
  title: { color: '#ffffff', fontFamily: FONTS.sans.extrabold, fontSize: 30 },
  whole: { marginHorizontal: -SIDE, paddingBottom: 18 },
});

/**
 * Whether a catalogue kind is one the hero leads with, which is a film or a programme.
 *
 * @param kind - The kind.
 * @returns Whether it is a film or a programme.
 */
const isBrowsed = (kind: string): kind is CatalogueBrowseKind =>
  kind === 'film' || kind === 'series';

/**
 * The top of Discover, as the home page's hero is the top of the library: the films and programmes
 * trending this week, each over its backdrop with its title logo, what it is and whether it is here
 * or asked for, swiped through a card at a time, with a way to read more and ask for it.
 *
 * @param titles - The titles to lead with.
 * @param onAsk - Told which title to open.
 */
const ADiscoverHero = ({ titles, onAsk }: ADiscoverHeroProps) => {
  const colours = useTheColours();
  const { width } = useWindowDimensions();
  const [at, setAt] = useState(0);
  const [unlettered, setUnlettered] = useState<ReadonlySet<string>>(new Set());
  const described = useQueries({
    queries: titles.map((title) => requestsQueries.askable(title.kind, title.id)),
  });
  const shown = described.flatMap((one) =>
    one.data === undefined || one.data.backdropUrl === null || !isBrowsed(one.data.kind)
      ? []
      : [one.data],
  );
  const wide = width - SIDE * 2;

  if (shown.length === 0) {
    return null;
  }

  return (
    <View style={styles.whole}>
      <ScrollView
        horizontal
        decelerationRate="fast"
        snapToInterval={wide + GAP}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: GAP, paddingHorizontal: SIDE }}
        onMomentumScrollEnd={(event) => {
          setAt(Math.round(event.nativeEvent.contentOffset.x / (wide + GAP)));
        }}
      >
        {shown.map((featured) => {
          const key = `${featured.kind}:${featured.id}`;
          const status = featured.standing.status;
          const kind = isBrowsed(featured.kind) ? featured.kind : 'film';

          return (
            <Button
              key={key}
              tone="bare"
              label={featured.title}
              onPress={() => {
                onAsk(kind, featured.id);
              }}
            >
              <View
                style={[
                  styles.card,
                  { height: wide * 1.25, width: wide, backgroundColor: colours.surfaceRaised },
                ]}
              >
                <ARemotePicture
                  style={styles.picture}
                  uri={onThisServer(featured.backdropUrl ?? '')}
                />
                <AScrim blurReach={0.55} />

                <View style={styles.said}>
                  {featured.logoUrl !== null && !unlettered.has(key) ? (
                    <ARemotePicture
                      style={styles.logo}
                      fit="contain"
                      uri={onThisServer(featured.logoUrl)}
                      label={featured.title}
                      onMissing={() => {
                        setUnlettered((was) => new Set([...was, key]));
                      }}
                    />
                  ) : (
                    <Text style={styles.title} numberOfLines={2}>
                      {featured.title}
                    </Text>
                  )}

                  <Text style={styles.facts}>
                    {[
                      featured.year?.toString() ?? null,
                      kind === 'film' ? say('common.film') : say('common.series'),
                    ]
                      .filter((part) => part !== null)
                      .join(' · ')}
                  </Text>

                  {featured.overview === null ? null : (
                    <Text style={styles.overview} numberOfLines={3}>
                      {featured.overview}
                    </Text>
                  )}

                  {status === 'askable' ? null : (
                    <Text style={styles.badge}>
                      {status === 'requested'
                        ? say('common.requested')
                        : say('common.inTheLibrary')}
                    </Text>
                  )}

                  <Button
                    tone="bright"
                    label={status === 'askable' ? say('common.request') : say('common.moreInfo')}
                    onPress={() => {
                      onAsk(kind, featured.id);
                    }}
                  >
                    {status === 'askable' ? say('common.request') : say('common.moreInfo')}
                  </Button>
                </View>
              </View>
            </Button>
          );
        })}
      </ScrollView>

      {shown.length < 2 ? null : (
        <View style={styles.dots}>
          {shown.map((featured, place) => (
            <View
              key={`${featured.kind}:${featured.id}`}
              style={[
                styles.dot,
                { backgroundColor: place === at ? colours.text : colours.border },
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
};

ADiscoverHero.displayName = 'ADiscoverHero';

export { ADiscoverHero };
