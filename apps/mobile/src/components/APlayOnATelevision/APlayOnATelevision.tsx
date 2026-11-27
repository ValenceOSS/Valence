import { useState } from 'react';
import { Tv } from '@keyline-icons/react-native/fill';
import { useVideoDevices } from '@ValenceClient/video/useVideoDevices';
import { APlayOnSheet } from '@ValenceMobile/components/APlayOnSheet/APlayOnSheet';
import { AWideButton } from '@ValenceMobile/components/AWideButton/AWideButton';
import { playOnTelevision } from '@ValenceMobile/playback/playOnTelevision';
import type { APlayOnATelevisionProps } from './APlayOnATelevision.types';
import { say } from '@ValenceI18n/say';

/**
 * A wide button beneath the way to watch a title that plays it on this person's television instead,
 * once Valence is open there and signed in to the same account: naming the television and starting
 * the title on it straight away where there is one, and offering the televisions to choose from
 * where there are several. Nothing shows where there is none.
 *
 * @param media - The title to send.
 * @param startSeconds - Where to start it.
 * @param onSent - Told once the title is on its way to a television, to bring up its remote.
 */
const APlayOnATelevision = ({ media, startSeconds, onSent }: APlayOnATelevisionProps) => {
  const televisions = useVideoDevices().filter((device) => device.kind === 'tv');
  const [isChoosing, setIsChoosing] = useState(false);
  const [only] = televisions;

  if (only === undefined) {
    return null;
  }

  if (televisions.length === 1) {
    return (
      <AWideButton
        icon={Tv}
        says={say('common.playOnLabel', { label: only.label })}
        label={say('common.playOnLabel', { label: only.label })}
        onPress={() => {
          playOnTelevision(only, media.id, startSeconds);
          onSent();
        }}
      />
    );
  }

  return (
    <>
      <AWideButton
        icon={Tv}
        says={say('common.playOnTV')}
        label={say('common.playOnTV')}
        onPress={() => {
          setIsChoosing(true);
        }}
      />

      <APlayOnSheet
        media={isChoosing ? media : null}
        startSeconds={startSeconds}
        onClose={() => {
          setIsChoosing(false);
        }}
        onSent={onSent}
      />
    </>
  );
};

APlayOnATelevision.displayName = 'APlayOnATelevision';

export { APlayOnATelevision };
