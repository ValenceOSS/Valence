import { Image } from 'expo-image';
import type { ImageSource } from 'expo-image';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { theCookiesThisPhoneHolds } from '@ValenceMobile/platform/theCookiesThisPhoneHolds';
import type { ARemotePictureProps } from './ARemotePicture.types';

/**
 * A picture fetched from an address, downloaded once however many places show it.
 *
 * React Native's own image starts a download for every copy on screen, so a poster in two rows is
 * fetched twice and both wait in the same short queue. This one keeps what it fetched in memory and
 * on disk, and joins a download already under way for the same address. The phone's cookies are
 * sent with it by hand, because on Android its downloads do not go through the jar the rest of the
 * app signs in with.
 *
 * Until the cookies have been read it holds its place as an empty box of the same size.
 *
 * @param uri - Where the picture is.
 * @param style - How big to draw it and where.
 * @param fit - Whether to fill the box and crop, or fit inside it.
 * @param label - What it shows, for anybody who cannot see it.
 * @param onMissing - Told where the picture cannot be had.
 * @param onLoad - Told how big the picture is once it has arrived.
 */
const ARemotePicture = ({
  uri,
  style,
  fit = 'cover',
  label,
  onMissing,
  onLoad,
}: ARemotePictureProps) => {
  const [source, setSource] = useState<ImageSource | null>(null);

  useEffect(() => {
    const moved = new AbortController();

    void theCookiesThisPhoneHolds(uri).then((cookie) => {
      if (!moved.signal.aborted) {
        setSource(cookie === null ? { uri } : { uri, headers: { Cookie: cookie } });
      }
    });

    return () => {
      moved.abort();
    };
  }, [uri]);

  if (source?.uri !== uri) {
    return <View style={style} />;
  }

  return (
    <Image
      style={style}
      source={source}
      contentFit={fit}
      cachePolicy="memory-disk"
      recyclingKey={uri}
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
