import { Bin, Pause, Play, RotateCcw } from '@keyline-icons/react-native';
import { Play as PlayFilled } from '@keyline-icons/react-native/fill';
import { Alert, StyleSheet, View } from 'react-native';
import { startListening } from '@ValenceClient/books/startListening';
import { describeKeptListening } from '@ValenceClient/downloads/describeKeptListening';
import { sourceOfKeptMusic } from '@ValenceClient/downloads/sourceOfKeptMusic';
import { theKeptListening } from '@ValenceClient/downloads/theKeptListening';
import { formatBytes } from '@ValenceCore/functions/formatBytes';
import { Button } from '@ValenceMobile/components/Button/Button';
import { HowFar } from '@ValenceMobile/components/HowFar/HowFar';
import { Icon } from '@ValenceMobile/components/Icon/Icon';
import { Words } from '@ValenceMobile/components/Words/Words';
import { thePhonesAudiobookPlayer } from '@ValenceMobile/books/thePhonesAudiobookPlayer';
import { thePhonesMusicPlayer } from '@ValenceMobile/music/thePhonesMusicPlayer';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import type { AKeptListeningRowProps } from './AKeptListeningRow.types';
import { say } from '@ValenceI18n/say';

const styles = StyleSheet.create({
  act: { padding: 10 },
  row: { alignItems: 'center', flexDirection: 'row', gap: 6 },
  words: { flex: 1, gap: 3 },
});

/**
 * One album, playlist, liked songs or audiobook this phone keeps, in the downloads list: how far it
 * has got, a way to play it, to pause or carry on fetching it, and, asked first, to take it off.
 *
 * @param kept - What is kept.
 * @param standing - How far it has got.
 * @param onPlaying - Told something has started playing, and which player has it.
 */
const AKeptListeningRow = ({ kept, standing, onPlaying }: AKeptListeningRowProps) => {
  const colours = useTheColours();
  const description = describeKeptListening(standing);
  const says = [
    kept.byline,
    description.says,
    standing.bytes > 0 ? formatBytes(standing.bytes) : null,
  ]
    .filter((part) => part !== null)
    .join(' · ');

  const play = () => {
    if (kept.kind === 'audiobook' && kept.book !== null) {
      void startListening(
        { book: kept.book, chapters: kept.chapters },
        thePhonesAudiobookPlayer(),
      ).then(() => {
        onPlaying('book');
      });

      return;
    }

    thePhonesMusicPlayer().play(kept.tracks, 0, { source: sourceOfKeptMusic(kept) });
    onPlaying('music');
  };

  const remove = () => {
    Alert.alert(
      say('common.removeTheDownloadOfTitle', { title: kept.title }),
      say('common.itComesOffThisDevice'),
      [
        { text: say('common.keepIt'), style: 'cancel' },
        {
          text: say('common.removeTheDownload'),
          style: 'destructive',
          onPress: () => {
            void theKeptListening().drop(kept.kind, kept.id);
          },
        },
      ],
    );
  };

  return (
    <View style={{ gap: 6 }}>
      <View style={styles.row}>
        <View style={styles.words}>
          <Words lines={2}>{kept.title}</Words>
          <Words size="small" tone={standing.state === 'failed' ? 'danger' : 'muted'}>
            {says}
          </Words>
        </View>

        {standing.filesHere > 0 ? (
          <Button tone="bare" label={say('common.playTitle', { title: kept.title })} onPress={play}>
            <View style={styles.act}>
              <Icon of={PlayFilled} size={20} colour={colours.accent} />
            </View>
          </Button>
        ) : null}

        {description.next === 'remove' ? null : (
          <Button
            tone="bare"
            label={
              description.next === 'pause'
                ? say('common.pauseTitle', { title: kept.title })
                : say('common.carryOnFetchingTitle', { title: kept.title })
            }
            onPress={() => {
              void theKeptListening().pause(kept.kind, kept.id, description.next === 'pause');
            }}
          >
            <View style={styles.act}>
              <Icon
                of={
                  description.next === 'pause'
                    ? Pause
                    : standing.state === 'failed'
                      ? RotateCcw
                      : Play
                }
                size={20}
                colour={colours.text}
              />
            </View>
          </Button>
        )}

        <Button
          tone="bare"
          label={say('common.removeTitleFromThisDevice', { title: kept.title })}
          onPress={remove}
        >
          <View style={styles.act}>
            <Icon of={Bin} size={18} colour={colours.textMuted} />
          </View>
        </Button>
      </View>

      {standing.state === 'here' ? null : (
        <HowFar
          fraction={standing.filesInAll === 0 ? 0 : standing.filesHere / standing.filesInAll}
          label={say('common.howFarTitleHasDownloaded', { title: kept.title })}
        />
      )}
    </View>
  );
};

AKeptListeningRow.displayName = 'AKeptListeningRow';

export { AKeptListeningRow };
