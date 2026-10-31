import { useContext, useState } from 'react';
import { Animated, StyleSheet, useWindowDimensions, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { APreview } from '@ValenceMobile/components/APreview/APreview';
import { ARemotePicture } from '@ValenceMobile/components/ARemotePicture/ARemotePicture';
import { ASoundSwitch } from '@ValenceMobile/components/ASoundSwitch/ASoundSwitch';
import { ATitleLogo } from '@ValenceMobile/components/ATitleLogo/ATitleLogo';
import { SCREEN_EDGE } from '@ValenceMobile/components/Screen/SCREEN_EDGE';
import { SCROLLED_BY } from '@ValenceMobile/components/Screen/SCROLLED_BY';
import { useSoundPreference } from '@ValenceMobile/hooks/useSoundPreference';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import { withAlpha } from '@ValenceCore/functions/withAlpha';
import type { ATitleHeadProps } from './ATitleHead.types';

const TALL = 1.05;

const LOGO_HIGH = 88;

const LOGO_AT_MOST = 0.7;

const INTO_THE_PAGE_FROM = 0.88;

const INTO_THE_FADE = 24;

const FADES_FROM = 0.6;

const SOFTENED_FULLY_AT = 80;

const SOFTENED_OVER = 160;

const UNDER_THE_CLOCK = 'linear-gradient(to bottom, rgba(0, 0, 0, 0.5) 0%, rgba(0, 0, 0, 0) 100%)';

const BEHIND_THE_LETTERING =
  'linear-gradient(to bottom, rgba(0, 0, 0, 0) 30%, rgba(0, 0, 0, 0.35) 60%, rgba(0, 0, 0, 0.6) 92%)';

const styles = StyleSheet.create({
  clock: { height: 120, left: 0, position: 'absolute', right: 0, top: 0 },
  softened: { height: SOFTENED_OVER, left: 0, position: 'absolute', right: 0, top: 0 },
  fills: { bottom: 0, left: 0, position: 'absolute', right: 0, top: 0 },
  logo: { alignItems: 'center', left: SCREEN_EDGE, position: 'absolute', right: SCREEN_EDGE },
  sound: { position: 'absolute', right: 6 },
  whole: { marginBottom: 8, overflow: 'hidden' },
});

/**
 * The head of a title's page, as the web's dialog draws it: the title's backdrop running edge to
 * edge under the clock, its clip fading in over that a moment later, and the title's lettering
 * centred low across where the picture gives way to the page below it, over a darkening of the
 * picture.
 *
 * The picture is darkened behind the lettering whatever the page is, as the web darkens it, since
 * lettering is almost always white and a light page would otherwise swallow it; only the strip
 * below the lettering fades to the page's own colour. The top is darkened too, and the clock drawn
 * light, so both read over a bright picture. Pulled down past the top of its page, the top of
 * the picture softens into the colour above it, so it never ends in a hard edge.
 *
 * Something the library does not hold, such as a film somebody may ask for, is drawn the same way
 * from where its backdrop and lettering are, without a clip.
 *
 * @param props - The title's name, the colour its artwork fades into where that is not the page's
 *   own, and either which title it is — whose backdrop and clip to draw, whether it has a
 *   backdrop, and whose lettering to draw, which for a programme is one of its episodes — or where
 *   its backdrop and lettering are.
 */
const ATitleHead = (props: ATitleHeadProps) => {
  const { title, ground } = props;
  const colours = useTheColours();
  const into = ground ?? colours.surface;
  const { width } = useWindowDimensions();
  const { isMuted, toggle } = useSoundPreference();
  const [isPlaying, setIsPlaying] = useState(false);
  const scrolled = useContext(SCROLLED_BY);
  const high = width * TALL;
  const intoThePage = `linear-gradient(to bottom, ${withAlpha(into, 0)} ${(FADES_FROM * 100).toString()}%, ${withAlpha(into, 0.55)} ${(INTO_THE_PAGE_FROM * 100).toString()}%, ${into} 100%)`;

  return (
    <View style={[styles.whole, { height: high }]}>
      <StatusBar style="light" />

      {'mediaId' in props ? (
        <APreview
          mediaId={props.mediaId}
          hasBackdrop={props.hasBackdrop}
          isShowing
          isMuted={isMuted}
          onPlaying={setIsPlaying}
        />
      ) : props.backdrop === null ? null : (
        <ARemotePicture style={styles.fills} uri={props.backdrop} />
      )}

      <View
        pointerEvents="none"
        style={[styles.clock, { experimental_backgroundImage: UNDER_THE_CLOCK }]}
      />

      <View
        pointerEvents="none"
        style={[styles.fills, { experimental_backgroundImage: BEHIND_THE_LETTERING }]}
      />

      <View
        pointerEvents="none"
        style={[styles.fills, { experimental_backgroundImage: intoThePage }]}
      />

      {scrolled === null ? null : (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.softened,
            {
              experimental_backgroundImage: `linear-gradient(to bottom, ${into} 0%, ${withAlpha(into, 0)} 100%)`,
              opacity: scrolled.interpolate({
                inputRange: [-SOFTENED_FULLY_AT, 0],
                outputRange: [1, 0],
                extrapolate: 'clamp',
              }),
            },
          ]}
        />
      )}

      {isPlaying ? (
        <View style={[styles.sound, { bottom: high * (1 - INTO_THE_PAGE_FROM) - INTO_THE_FADE }]}>
          <ASoundSwitch isMuted={isMuted} onToggle={toggle} />
        </View>
      ) : null}

      <View style={[styles.logo, { bottom: high * (1 - INTO_THE_PAGE_FROM) - LOGO_HIGH / 2 }]}>
        <ATitleLogo
          {...('mediaId' in props
            ? { mediaId: props.letteredBy }
            : { mediaId: null, uri: props.lettering })}
          title={title}
          high={LOGO_HIGH}
          widest={width * LOGO_AT_MOST}
          isOnArtwork
        />
      </View>
    </View>
  );
};

ATitleHead.displayName = 'ATitleHead';

export { ATitleHead };
