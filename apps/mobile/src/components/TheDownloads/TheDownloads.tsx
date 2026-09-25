import {
  Bin,
  Download as DownloadIcon,
  Pause,
  Play,
  Smartphone,
} from '@keyline-icons/react-native';
import { Play as PlayFilled } from '@keyline-icons/react-native/fill';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, StyleSheet, View } from 'react-native';
import { formatBytes } from '@ValenceCore/functions/formatBytes';
import { forgetDownload } from '@ValenceClient/downloads/fetchDownloads';
import { dropAFile, keepAFile, pauseAFile } from '@ValenceClient/downloads/keepingFiles';
import { useHeldFiles } from '@ValenceClient/downloads/useHeldFiles';
import { downloadQueries } from '@ValenceClient/query/downloadQueries';
import { Button } from '@ValenceMobile/components/Button/Button';
import { HowFar } from '@ValenceMobile/components/HowFar/HowFar';
import { Icon } from '@ValenceMobile/components/Icon/Icon';
import { Screen } from '@ValenceMobile/components/Screen/Screen';
import { Words } from '@ValenceMobile/components/Words/Words';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import { ANothingHere } from '@ValenceMobile/components/ANothingHere/ANothingHere';
import { say } from '@ValenceI18n/say';
import type { Download } from '@ValenceContracts/schemas/Download';
import type { HeldFile } from '@ValenceContracts/schemas/HeldFile';
import type { TheDownloadsProps } from './TheDownloads.types';

const styles = StyleSheet.create({
  act: { padding: 10 },
  row: { alignItems: 'center', flexDirection: 'row', gap: 6 },
  words: { flex: 1, gap: 3 },
});

type ARow = { id: string; title: string; download: Download | null; held: HeldFile | null };

/**
 * What has been downloaded, as the web's downloads list: what the server is preparing, what is
 * ready to fetch, and what this phone keeps — how far each has got, a way to pause and pick up a
 * fetch, to watch what is here, to take it off the phone, and, asked first, to have the server
 * forget it altogether.
 *
 * What the phone keeps is listed even where the server cannot be reached, since that is when it is
 * wanted.
 *
 * @param onWatch - Told to play a film this phone keeps.
 * @param onBack - Told somebody is done with it, where it was opened from somewhere rather than
 *   being a tab of its own.
 */
const TheDownloads = ({ onWatch, onBack }: TheDownloadsProps) => {
  const cache = useQueryClient();
  const colours = useTheColours();
  const downloads = useQuery(downloadQueries.all());
  const held = useHeldFiles();
  const heldById = new Map(held.map((file) => [file.downloadId, file]));
  const listed = new Set((downloads.data ?? []).map((download) => download.id));
  const rows: ARow[] = [
    ...(downloads.data ?? []).map((download) => ({
      id: download.id,
      title:
        download.seriesTitle === null
          ? download.title
          : `${download.seriesTitle} — ${download.title}`,
      download,
      held: heldById.get(download.id) ?? null,
    })),
    ...held
      .filter((file) => !listed.has(file.downloadId))
      .map((file) => ({ id: file.downloadId, title: file.title, download: null, held: file })),
  ];

  const reread = () => cache.invalidateQueries({ queryKey: downloadQueries.all().queryKey });

  const forget = (row: ARow) => {
    Alert.alert(
      say('phone.theDownloads.forgetTitle', { title: row.title }),
      say('phone.theDownloads.forgetBody'),
      [
        { text: say('phone.theDownloads.keepIt'), style: 'cancel' },
        {
          text: say('phone.theDownloads.forgetIt'),
          style: 'destructive',
          onPress: () => {
            void dropAFile(row.id)
              .then(async () => (row.download === null ? true : forgetDownload(row.id)))
              .then(reread);
          },
        },
      ],
    );
  };

  const drawn = rows.map((row) => {
    const { download, held: file } = row;
    const fraction =
      file !== null && file.state !== 'here'
        ? file.ofBytes === null || file.ofBytes === 0
          ? 0
          : file.bytes / file.ofBytes
        : download?.state === 'preparing'
          ? download.progress
          : null;
    const says =
      file?.state === 'here'
        ? say('phone.theDownloads.onThisPhone')
        : file?.state === 'fetching'
          ? [
              say('phone.theDownloads.fetching'),
              file.ofBytes === null
                ? null
                : say('phone.theDownloads.bytesOf', {
                    done: formatBytes(file.bytes),
                    total: formatBytes(file.ofBytes),
                  }),
              file.bytesPerSecond === null
                ? null
                : say('phone.theDownloads.perSecond', { amount: formatBytes(file.bytesPerSecond) }),
            ]
              .filter((part) => part !== null)
              .join(' · ')
          : file?.state === 'paused'
            ? say('phone.theDownloads.paused')
            : file?.state === 'failed'
              ? (file.failure ?? say('phone.theDownloads.couldNotFetch'))
              : download?.state === 'preparing'
                ? say('phone.theDownloads.preparing')
                : download?.state === 'ready'
                  ? say('phone.theDownloads.readyToFetch')
                  : download?.state === 'failed'
                    ? (download.failure ?? say('phone.theDownloads.couldNotPrepare'))
                    : say('phone.theDownloads.waiting');

    return (
      <View key={row.id} style={{ gap: 6 }}>
        <View style={styles.row}>
          <View style={styles.words}>
            <Words lines={2}>{row.title}</Words>
            <Words size="small" tone={file?.state === 'failed' ? 'danger' : 'muted'}>
              {says}
            </Words>
          </View>

          {file?.state === 'here' ? (
            <Button
              tone="bare"
              label={say('phone.theDownloads.watch', { title: row.title })}
              onPress={() => {
                onWatch(file);
              }}
            >
              <View style={styles.act}>
                <Icon of={PlayFilled} size={20} colour={colours.accent} />
              </View>
            </Button>
          ) : null}

          {file?.state === 'fetching' || file?.state === 'paused' ? (
            <Button
              tone="bare"
              label={
                file.state === 'paused'
                  ? say('phone.theDownloads.carryOn', { title: row.title })
                  : say('phone.theDownloads.pause', { title: row.title })
              }
              onPress={() => {
                void pauseAFile(row.id, file.state !== 'paused');
              }}
            >
              <View style={styles.act}>
                <Icon of={file.state === 'paused' ? Play : Pause} size={20} colour={colours.text} />
              </View>
            </Button>
          ) : null}

          {file === null && download?.state === 'ready' ? (
            <Button
              tone="bare"
              label={say('phone.theDownloads.keep', { title: row.title })}
              onPress={() => {
                void keepAFile(download);
              }}
            >
              <View style={styles.act}>
                <Icon of={Smartphone} size={20} colour={colours.accent} />
              </View>
            </Button>
          ) : null}

          <Button
            tone="bare"
            label={say('phone.theDownloads.forget', { title: row.title })}
            onPress={() => {
              forget(row);
            }}
          >
            <View style={styles.act}>
              <Icon of={Bin} size={18} colour={colours.textMuted} />
            </View>
          </Button>
        </View>

        {fraction === null ? null : (
          <HowFar
            fraction={fraction}
            label={say('phone.theDownloads.howFar', { title: row.title })}
          />
        )}
      </View>
    );
  });

  return (
    <Screen scrolls {...(onBack === undefined ? {} : { onBack })}>
      <Words size="title">{say('phone.theDownloads.heading')}</Words>

      {rows.length === 0 ? (
        <ANothingHere
          of={DownloadIcon}
          title={say('phone.theDownloads.emptyTitle')}
          detail={say('phone.theDownloads.emptyDetail')}
        />
      ) : (
        drawn
      )}
    </Screen>
  );
};

TheDownloads.displayName = 'TheDownloads';

export { TheDownloads };
