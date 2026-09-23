import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TVFocusGuideView,
  View,
} from 'react-native';
import { useRef } from 'react';
import { Image } from 'expo-image';
import { useQuery } from '@tanstack/react-query';
import { sessionQueries } from '@ValenceClient/query/sessionQueries';
import { Face } from '@ValenceTv/components/Face/Face';
import { FadeIn } from '@ValenceTv/components/FadeIn/FadeIn';
import { WayInBackdrop } from '@ValenceTv/components/WayInBackdrop/WayInBackdrop';
import { theServersOrigin } from '@ValenceTv/platform/theServersOrigin';
import { whereOnScreen } from '@ValenceTv/layout/whereOnScreen';
import { useReportSpot } from '@ValenceTv/layout/useReportSpot';
import { Focusable } from '@ValenceTv/components/Focusable/Focusable';
import { Button } from '@ValenceTv/components/Button/Button';
import { tokens } from '@ValenceTv/theme/tokens';
import mark from '@ValenceTv/assets/valence-mark.png';
import type { WhoIsWatchingProps } from './WhoIsWatching.types';

const FACE_SIZE = 200;

const MARK = { width: 110, height: 80 };

const STAGGER_MS = 70;

const STAGGERED = 8;

/**
 * Who is watching: the household's faces in a row, for the remote to move along and pick one, as the
 * web's sign-in page has them — Valence's mark and the question under a glow of its blue, the faces
 * rising into place one after another, and the server named at the foot of the screen. The buttons
 * beneath catch the remote across the whole width, so pressing down from any face reaches them.
 *
 * Picking a face asks for its PIN. A household that would rather not type anything with a remote
 * signs in with a phone instead, which is offered beneath the faces rather than instead of them.
 *
 * @param onChoose - Told which face was picked, and where it and Valence's mark were on the screen,
 *   for them to fly from.
 * @param onUsePhone - Told when somebody would rather sign in with their phone.
 * @param onChangeServer - Told when somebody wants a different Valence.
 */
const WhoIsWatching = ({ onChoose, onUsePhone, onChangeServer }: WhoIsWatchingProps) => {
  const wayIn = useQuery(sessionQueries.wayIn());
  const profiles = wayIn.data?.profiles ?? [];
  const faces = useRef(new Map<string, View>());
  const markSpot = useReportSpot();

  return (
    <View style={styles.screen}>
      <WayInBackdrop />

      <FadeIn isFilling={false}>
        <View style={styles.top}>
          <View ref={markSpot.ref} collapsable={false}>
            <Image source={mark} style={MARK} contentFit="contain" />
          </View>
          <Text style={styles.title}>Who is watching?</Text>
        </View>
      </FadeIn>

      {wayIn.isPending ? (
        <ActivityIndicator size="large" color={tokens.colours.text} />
      ) : wayIn.isError ? (
        <Text style={styles.problem}>This Valence could not be reached.</Text>
      ) : (
        <FlatList
          horizontal
          data={profiles}
          keyExtractor={(profile) => profile.id}
          style={styles.faces}
          contentContainerStyle={styles.facesInside}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item, index }) => (
            <FadeIn isFilling={false} delayMs={STAGGER_MS * Math.min(index, STAGGERED)}>
              <Focusable
                label={item.name}
                hasPreferredFocus={index === 0}
                onPress={() => {
                  const face = faces.current.get(item.id);

                  void Promise.all([
                    face === undefined ? Promise.resolve(null) : whereOnScreen(face),
                    markSpot.whereNow(),
                  ]).then(([faceAt, markAt]) => {
                    onChoose(item, { face: faceAt, mark: markAt });
                  });
                }}
              >
                {(isFocused) => (
                  <View style={styles.person}>
                    <View
                      ref={(face) => {
                        if (face === null) {
                          faces.current.delete(item.id);
                        } else {
                          faces.current.set(item.id, face);
                        }
                      }}
                      collapsable={false}
                    >
                      <Face profile={item} size={FACE_SIZE} isFocused={isFocused} />
                    </View>
                    <Text style={[styles.name, isFocused && styles.nameFocused]}>{item.name}</Text>
                  </View>
                )}
              </Focusable>
            </FadeIn>
          )}
        />
      )}

      <FadeIn isFilling={false} delayMs={STAGGER_MS * STAGGERED}>
        <TVFocusGuideView autoFocus style={styles.actions}>
          <Button label="Sign in with your phone" variant="secondary" onPress={onUsePhone} />
          <Button label="Use a different server" variant="ghost" onPress={onChangeServer} />
        </TVFocusGuideView>
      </FadeIn>

      <Text style={styles.footer}>
        © Valence · {(theServersOrigin() ?? 'this Valence').replace(/^https?:\/\//u, '')}
      </Text>
    </View>
  );
};

WhoIsWatching.displayName = 'WhoIsWatching';

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingVertical: tokens.space.xl,
    justifyContent: 'center',
    gap: tokens.space.xl,
  },
  top: { alignItems: 'center', gap: tokens.space.lg },
  title: {
    color: tokens.colours.text,
    fontSize: tokens.type.hero,
    fontWeight: '700',
    textAlign: 'center',
  },
  problem: { color: tokens.colours.muted, fontSize: tokens.type.body, textAlign: 'center' },
  faces: { flexGrow: 0 },
  facesInside: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: tokens.space.edge,
    gap: tokens.space.lg,
    paddingVertical: 30,
  },
  person: { alignItems: 'center', gap: tokens.space.sm, width: FACE_SIZE + 20 },
  name: { color: tokens.colours.muted, fontSize: tokens.type.body },
  nameFocused: { color: tokens.colours.text, fontWeight: '600' },
  actions: { flexDirection: 'row', justifyContent: 'center', gap: tokens.space.md },
  footer: {
    position: 'absolute',
    bottom: tokens.space.lg,
    alignSelf: 'center',
    color: tokens.colours.muted,
    fontSize: tokens.type.small - 4,
  },
});

export { WhoIsWatching };
