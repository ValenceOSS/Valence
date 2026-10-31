import { requireOptionalNativeModule } from 'expo';
import GoogleCast from 'react-native-google-cast';
import { theMusicPlayer } from '@ValenceClient/music/theMusicPlayer';
import { speakerAudio } from '@ValenceMobile/audio/speakerAudio';
import { castAudio } from '@ValenceMobile/music/castAudio';
import { castableAudio } from '@ValenceMobile/music/castableAudio';
import { say } from '@ValenceI18n/say';
import type { CastSession } from 'react-native-google-cast';
import type { NativeMusic } from '@ValenceMobile/music/NativeMusic.types';
import type { CastableMusic } from './theCastableMusic.types';

let made: CastableMusic | null = null;

const WANTED_FOR_MS = 60_000;

/**
 * The phone's music speaker, made the first time it is asked for, which the music can be moved off
 * onto a Chromecast and back.
 *
 * Asked to cast the music, it moves it to the device already connected, or opens the system's list
 * of devices and moves it to whichever is chosen. A device connected for a film is left to the film,
 * and so is one connected long after the list was opened for music: the list says nothing when it
 * is put away without a choice, so the music's ask lapses after a minute rather than waiting to take
 * whatever device is connected next.
 * When the device goes, or is sent something else, the music comes back to the phone, paused.
 *
 * It is let go with the music player it plays for, on signing out, and made again for the next.
 *
 * @param speaker - The phone's music module.
 * @returns The speaker.
 */
const theCastableMusic = (
  speaker: NativeMusic | null = requireOptionalNativeModule<NativeMusic>('ValenceMusic'),
): CastableMusic => {
  if (made !== null) {
    return made;
  }

  if (speaker === null) {
    throw new Error('This build of Valence cannot play music.');
  }

  const sessions = GoogleCast.getSessionManager();
  let wantedAt: number | null = null;

  const castable = castableAudio(speakerAudio(speaker, 'music'), (client) =>
    castAudio(client, {
      describe: (trackId) =>
        theMusicPlayer()
          .read()
          .queue?.tracks.find((track) => track.id === trackId) ?? null,
      onLost: () => {
        castable.bringBack();
      },
    }),
  );

  const castOn = (session: CastSession): void => {
    wantedAt = null;
    void session
      .getCastDevice()
      .catch(() => null)
      .then((device) => {
        castable.castTo(
          session.client,
          device?.friendlyName ?? say('phone.aDevicesSheet.chromecast'),
        );
      });
  };

  const heard = [
    sessions.onSessionStarted((session) => {
      if (wantedAt !== null && Date.now() - wantedAt < WANTED_FOR_MS) {
        castOn(session);
      }

      wantedAt = null;
    }),
    sessions.onSessionStartFailed(() => {
      wantedAt = null;
    }),
    sessions.onSessionEnded(() => {
      castable.bringBack();
    }),
  ];

  const released = castable.release;

  made = Object.assign(castable, {
    castTheMusic: () => {
      void sessions
        .getCurrentCastSession()
        .catch(() => null)
        .then((session) => {
          if (session !== null) {
            castOn(session);

            return;
          }

          wantedAt = Date.now();
          void GoogleCast.showCastDialog().catch(() => false);
        });
    },
    stopCasting: () => {
      void sessions.endCurrentSession(true).catch(() => undefined);
    },
    release: () => {
      heard.forEach((hearing) => {
        hearing.remove();
      });
      released?.();
      made = null;
    },
  });

  return made;
};

export { theCastableMusic };
