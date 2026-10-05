import { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { useEventListener } from 'expo';
import { useVideoPlayer, VideoView } from 'expo-video';
import { theCookiesThisPhoneHolds } from '@ValenceMobile/platform/theCookiesThisPhoneHolds';
import type { VideoSource } from 'expo-video';
import type { AMovingFaceProps } from './AMovingFace.types';

const styles = StyleSheet.create({
  fills: { bottom: 0, left: 0, position: 'absolute', right: 0, top: 0 },
});

/**
 * A profile picture that is a short video, playing silently on a loop, as the web plays one. It asks
 * with the phone's session, as the server only hands a face to somebody signed in. Where the phone
 * cannot play it, as an iPhone cannot play WebM, nothing is drawn and the letter beneath shows.
 *
 * @param uri - Where the video is.
 */
const AMovingFace = ({ uri }: AMovingFaceProps) => {
  const [source, setSource] = useState<VideoSource | null>(null);
  const [isBroken, setIsBroken] = useState(false);

  useEffect(() => {
    let isCurrent = true;

    void theCookiesThisPhoneHolds(uri).then((cookie) => {
      if (isCurrent) {
        setSource(cookie === null ? { uri } : { uri, headers: { Cookie: cookie } });
      }
    });

    return () => {
      isCurrent = false;
    };
  }, [uri]);

  const player = useVideoPlayer(source, (ready) => {
    ready.muted = true;
    ready.loop = true;
  });

  useEventListener(player, 'sourceLoad', () => {
    player.play();
  });
  useEventListener(player, 'statusChange', ({ status }) => {
    if (status === 'error') {
      setIsBroken(true);
    }
  });

  if (source === null || isBroken) {
    return null;
  }

  return (
    <VideoView style={styles.fills} player={player} nativeControls={false} contentFit="cover" />
  );
};

AMovingFace.displayName = 'AMovingFace';

export { AMovingFace };
