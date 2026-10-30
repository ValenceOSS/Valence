import { sayAgainIfAny } from '@ValenceI18n/sayAgainIfAny';
import { Download as DownloadIcon } from '@keyline-icons/react-native';
import {
  Bin as BinFilled,
  Pause as PauseFilled,
  Play as PlayFilled,
  RotateCcw as RotateCcwFilled,
  Smartphone as SmartphoneFilled,
} from '@keyline-icons/react-native/fill';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert } from 'react-native';
import { formatBytes } from '@ValenceCore/functions/formatBytes';
import { forgetDownload } from '@ValenceClient/downloads/fetchDownloads';
import {
  dropAFile,
  keepAFile,
  pauseAFile,
  posterForAFile,
} from '@ValenceClient/downloads/keepingFiles';
import { useHeldFiles } from '@ValenceClient/downloads/useHeldFiles';
import { standingOfKeptListening } from '@ValenceClient/downloads/standingOfKeptListening';
import { useKeptListening } from '@ValenceClient/downloads/useKeptListening';
import { platformInUse } from '@ValenceClient/platform/installPlatform';
import { AKeptListeningRow } from './components/AKeptListeningRow/AKeptListeningRow';
import { downloadQueries } from '@ValenceClient/query/downloadQueries';
import { ASplitButton } from '@ValenceMobile/components/ASplitButton/ASplitButton';
import { ADownloadCard } from './components/ADownloadCard/ADownloadCard';
import { artworkUrl } from '@ValenceClient/library/artworkUrl';
import { onThisServer } from '@ValenceMobile/platform/onThisServer';
import { howLongItRuns } from '@ValenceMobile/components/ATitle/howLongItRuns';
import { QUALITY_STEPS } from '@ValenceContracts/schemas/QualityStep';
import { Screen } from '@ValenceMobile/components/Screen/Screen';
import { Words } from '@ValenceMobile/components/Words/Words';
import { ANothingHere } from '@ValenceMobile/components/ANothingHere/ANothingHere';
import type { Download } from '@ValenceContracts/schemas/Download';
import type { HeldFile } from '@ValenceContracts/schemas/HeldFile';
import type { TheDownloadsProps } from './TheDownloads.types';
import { say } from '@ValenceI18n/say';

type ARow = { id: string; title: string; download: Download | null; held: HeldFile | null };

/**
 * What has been downloaded, each on a card with its poster, its quality, size and length: what the
 * server is preparing, what is ready to fetch, and what this phone keeps — how far each has got, a way to pause and pick up a
 * fetch, to watch what is here, to take it off the phone, and, asked first, to have the server
 * forget it altogether.
 *
 * What the phone keeps is listed even where the server cannot be reached, since that is when it is
 * wanted.
 *
 * @param onWatch - Told to play a film this phone keeps.
 * @param onPlaying - Told music or an audiobook this phone keeps has started, and which player has
 *   it.
 * @param onBack - Told somebody is done with it, where it was opened from somewhere rather than
 *   being a tab of its own.
 * @param header - What stands above it where it slides in beneath the library's bar, as Search
 *   does, over the library's own background; its title is then the bar's.
 * @param onScrolled - Told whether it has been scrolled from its top.
 * @param searchingFor - What was typed in the library's bar, which only the downloads whose name
 *   holds it are listed for.
 */
const TheDownloads = ({
  onWatch,
  onPlaying = () => {},
  onBack,
  header,
  onScrolled,
  searchingFor = '',
}: TheDownloadsProps) => {
  const cache = useQueryClient();
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
      .map((file) => ({
        id: file.downloadId,
        title: file.seriesTitle === null ? file.title : `${file.seriesTitle} — ${file.title}`,
        download: null,
        held: file,
      })),
  ];

  const wanted = searchingFor.trim().toLowerCase();
  const shown =
    wanted === '' ? rows : rows.filter((row) => row.title.toLowerCase().includes(wanted));
  const listening = useKeptListening();
  const listeningShown = listening.here.filter(
    (kept) => wanted === '' || kept.title.toLowerCase().includes(wanted),
  );

  const reread = () => cache.invalidateQueries({ queryKey: downloadQueries.all().queryKey });

  const forget = (row: ARow) => {
    Alert.alert(
      say('common.forgetTitle', { title: row.title }),
      say('phone.theDownloads.itComesOffThisPhoneAnd'),
      [
        { text: say('common.keepIt'), style: 'cancel' },
        {
          text: say('phone.theDownloads.forgetIt'),
          style: 'destructive',
          onPress: () => {
            void dropAFile(row.id)
              .then(async () => (row.download === null ? true : forgetDownload(row.id)))
              .catch(() => false)
              .finally(() => {
                void reread();
              });
          },
        },
      ],
    );
  };

  const drawn = shown.map((row) => {
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
        ? say('common.onThisPhone')
        : file?.state === 'fetching'
          ? [
              say('common.downloading'),
              file.ofBytes === null
                ? null
                : say('common.doneOfTotal', {
                    done: formatBytes(file.bytes),
                    total: formatBytes(file.ofBytes),
                  }),
              file.bytesPerSecond === null ? null : `${formatBytes(file.bytesPerSecond)}/s`,
            ]
              .filter((part) => part !== null)
              .join(' · ')
          : file?.state === 'paused'
            ? say('common.paused')
            : file?.state === 'failed'
              ? (file.failure ?? say('common.downloadFailed'))
              : download?.state === 'preparing'
                ? say('common.theServerIsPreparingIt')
                : download?.state === 'ready'
                  ? say('phone.theDownloads.readyToFetch')
                  : download?.state === 'failed'
                    ? (sayAgainIfAny(download.failure) ??
                      say('phone.theDownloads.couldNotBePrepared'))
                    : say('common.waiting');

    const quality = file?.quality ?? download?.quality ?? null;
    const size = file?.ofBytes ?? download?.sizeBytes ?? null;
    const runs = file?.durationSeconds ?? null;
    const mediaId = file?.mediaId ?? download?.mediaId ?? null;
    const facts = [
      quality === null
        ? null
        : quality === 'original'
          ? say('common.original')
          : (QUALITY_STEPS.find((step) => step.id === quality)?.label ?? quality),
      size === null || size === 0 ? null : formatBytes(size),
      runs === null ? null : howLongItRuns(runs),
    ].filter((fact) => fact !== null);
    const artwork =
      file?.hasPoster === true
        ? posterForAFile(file.downloadId)
        : mediaId === null
          ? null
          : onThisServer(artworkUrl(mediaId, 'poster', { size: 'small' }));

    return (
      <ADownloadCard
        key={row.id}
        title={row.title}
        artwork={artwork}
        facts={facts}
        says={says}
        isFailed={file?.state === 'failed' || download?.state === 'failed'}
        fraction={fraction}
        progressLabel={say('common.howFarTitleHasDownloaded', { title: row.title })}
      >
        <ASplitButton
          parts={[
            ...(file?.state === 'here'
              ? [
                  {
                    icon: PlayFilled,
                    tone: 'bold' as const,
                    label: say('phone.theDownloads.watchTitle', { title: row.title }),
                    onPress: () => {
                      onWatch(file);
                    },
                  },
                ]
              : []),
            ...(file?.state === 'fetching' || file?.state === 'paused'
              ? [
                  {
                    icon: file.state === 'paused' ? PlayFilled : PauseFilled,
                    label:
                      file.state === 'paused'
                        ? say('common.carryOnFetchingTitle', { title: row.title })
                        : say('common.pauseTitle', { title: row.title }),
                    onPress: () => {
                      void pauseAFile(row.id, file.state !== 'paused');
                    },
                  },
                ]
              : []),
            ...(file?.state === 'failed'
              ? [
                  {
                    icon: RotateCcwFilled,
                    label: say('phone.theDownloads.tryTitleAgain', { title: row.title }),
                    onPress: () => {
                      void pauseAFile(row.id, false);
                    },
                  },
                ]
              : []),
            ...(file === null && download?.state === 'ready'
              ? [
                  {
                    icon: SmartphoneFilled,
                    label: say('phone.theDownloads.keepTitleOnThisPhone', { title: row.title }),
                    onPress: () => {
                      void keepAFile(download);
                    },
                  },
                ]
              : []),
            {
              icon: BinFilled,
              tone: 'danger' as const,
              label: say('phone.theDownloads.forgetTitle', { title: row.title }),
              onPress: () => {
                forget(row);
              },
            },
          ]}
        />
      </ADownloadCard>
    );
  });

  return (
    <Screen
      scrolls
      isSeeThrough={header !== undefined}
      {...(onBack === undefined ? {} : { onBack })}
      {...(onScrolled === undefined ? {} : { onScrolled })}
    >
      {header ?? <Words size="title">{say('common.downloads')}</Words>}

      {rows.length + listening.here.length > 0 && shown.length + listeningShown.length === 0 ? (
        <Words tone="muted">{say('phone.theDownloads.noDownloadIsCalledThat')}</Words>
      ) : rows.length + listening.here.length === 0 ? (
        <ANothingHere
          of={DownloadIcon}
          title={say('phone.theDownloads.nothingDownloadedYet')}
          detail={say('phone.theDownloads.downloadSomethingFromItsPage')}
        />
      ) : (
        <>
          {drawn}
          {listeningShown.map((kept) => (
            <AKeptListeningRow
              key={`${kept.kind}-${kept.id}`}
              kept={kept}
              standing={standingOfKeptListening(
                listening,
                kept,
                platformInUse().listeningFiles.canPlay,
              )}
              onPlaying={onPlaying}
            />
          ))}
        </>
      )}
    </Screen>
  );
};

TheDownloads.displayName = 'TheDownloads';

export { TheDownloads };
