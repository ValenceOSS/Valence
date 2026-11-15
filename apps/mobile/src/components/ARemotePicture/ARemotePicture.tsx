import { Image } from 'expo-image';
import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { View } from 'react-native';
import { heldCookies } from '@ValenceMobile/platform/heldCookies';
import type { ARemotePictureProps } from './ARemotePicture.types';

const FADES_IN_OVER = 120;

/**
 * A picture fetched from an address, downloaded once however many places show it.
 *
 * React Native's own image starts a download for every copy on screen, so a poster in two rows is
 * fetched twice and both wait in the same short queue. This one keeps what it fetched in memory and
 * on disk, and joins a download already under way for the same address. The phone's cookies are
 * sent with it by hand, because on Android its downloads do not go through the jar the rest of the
 * app signs in with.
 *
 * The cookies are read once for a server and held, so a picture drawn after the first is drawn at
 * once, straight from memory where it is there. Only where they have not been read yet does it hold
 * its place, as an empty box of the same size in the colour it was given, until they have.
 *
 * @param uri - Where the picture is.
 * @param style - How big to draw it and where.
 * @param fit - Whether to fill the box and crop, or fit inside it.
 * @param isTopKept - Whether cropping keeps the top of the picture rather than its middle, as for a
 *   poster, whose faces sit high.
 * @param blur - How far to soften it, in points, where it stands behind a sharp copy of itself.
 * @param label - What it shows, for anybody who cannot see it.
 * @param ground - The colour it shows until the picture arrives, where it has one.
 * @param onMissing - Told where the picture cannot be had.
 * @param onLoad - Told how big the picture is once it has arrived.
 */
const ARemotePicture = ({
  uri,
  style,
  fit = 'cover',
  isTopKept = false,
  blur,
  label,
  ground,
  onMissing,
  onLoad,
}: ARemotePictureProps) => {
  const held = useSyncExternalStore(heldCookies.listen, () => heldCookies.now(uri));
  const [heldNoneFor, setHeldNoneFor] = useState<string | null>(null);
  const isKnown = held !== undefined;

  useEffect(() => {
    if (isKnown) {
      void heldCookies.ask(uri);

      return undefined;
    }

    let isGone = false;

    void heldCookies.ask(uri).then((cookie) => {
      if (!isGone && cookie === null) {
        setHeldNoneFor(uri);
      }
    });

    return () => {
      isGone = true;
    };
  }, [uri, isKnown]);

  const cookie = isKnown ? held : heldNoneFor === uri ? null : undefined;

  const source = useMemo(
    () =>
      cookie === undefined
        ? null
        : cookie === null
          ? { uri }
          : { uri, headers: { Cookie: cookie } },
    [uri, cookie],
  );

  const drawnOn = useMemo(
    () => (ground === undefined ? style : [style, { backgroundColor: ground }]),
    [style, ground],
  );

  if (source === null) {
    return <View style={drawnOn} />;
  }

  return (
    <Image
      style={drawnOn}
      source={source}
      contentFit={fit}
      contentPosition={isTopKept ? 'top' : 'center'}
      {...(blur === undefined ? {} : { blurRadius: blur })}
      cachePolicy="memory-disk"
      transition={FADES_IN_OVER}
      {...(label === undefined ? {} : { accessible: true, accessibilityLabel: label })}
      onError={() => {
        onMissing?.();
      }}
      onLoad={(event) => {
        onLoad?.({ width: event.source.width, height: event.source.height });
      }}
      accessibilityIgnoresInvertColors
    />
  );
};

ARemotePicture.displayName = 'ARemotePicture';

export { ARemotePicture };
