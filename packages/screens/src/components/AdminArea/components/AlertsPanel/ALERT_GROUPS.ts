import type { AdminAlert } from '@ValenceContracts/schemas/AdminAlert';
import { ALERT_THRESHOLDS } from '@ValenceScreens/components/AdminArea/ALERT_THRESHOLDS';
import { say } from '@ValenceI18n/say';

type AlertChoice = {
  id: AdminAlert;
  title: string;
  description: string;
};

type AlertGroup = {
  title: string;
  alerts: readonly AlertChoice[];
};

const ALERT_GROUPS: readonly AlertGroup[] = [
  {
    title: say('screens.adminArea.alertsPanel.services'),
    alerts: [
      {
        id: 'requests',
        title: say('screens.adminArea.alertsPanel.requestsServiceUnreachable'),
        description: say(
          'screens.adminArea.alertsPanel.showsWhenTheServerCantReachTheRequestsService',
        ),
      },
      {
        id: 'requests-vpn',
        title: say('contracts.schemas.webhook.vPNDown'),
        description: say('screens.adminArea.alertsPanel.showsWhenTheVPNConnectionDrops'),
      },
      {
        id: 'requests-solver',
        title: say('screens.adminArea.alertsPanel.cloudflareSolverWontStart'),
        description: say('screens.adminArea.alertsPanel.showsWhenTheCloudflareSolverFailsToStart'),
      },
      {
        id: 'transcoder',
        title: say('screens.adminArea.alertsPanel.mediaServiceUnreachable'),
        description: say(
          'screens.adminArea.alertsPanel.showsWhenTheServerCantReachTheMediaService',
        ),
      },
      {
        id: 'ffmpeg-version',
        title: say('screens.adminArea.alertsPanel.unsupportedFFmpeg'),
        description: say(
          'screens.adminArea.alertsPanel.showsWhenTheMediaServiceRunsAnUnsupportedFFmpeg',
        ),
      },
    ],
  },
  {
    title: say('common.requests'),
    alerts: [
      {
        id: 'requests-indexers',
        title: say('screens.adminArea.alertsPanel.failingIndexers'),
        description: say('screens.adminArea.alertsPanel.showsWhenAnIndexerKeepsFailing'),
      },
    ],
  },
  {
    title: say('tv.player.streamStats.playback'),
    alerts: [
      {
        id: 'playback-problems',
        title: say('screens.adminArea.alertsPanel.playbackErrors'),
        description: say('screens.adminArea.alertsPanel.showsWhenPlaybackStoppedWithAnError'),
      },
      {
        id: 'starved-sessions',
        title: say('screens.adminArea.alertsPanel.lowBuffer'),
        description: say('screens.adminArea.alertsPanel.showsWhenAStreamIsSecondsFromStalling'),
      },
    ],
  },
  {
    title: say('common.jobs'),
    alerts: [
      {
        id: 'failed-jobs',
        title: say('screens.adminArea.alertsPanel.failedJobs'),
        description: say('screens.adminArea.alertsPanel.showsWhenAJobFailedInTheLast24Hours'),
      },
      {
        id: 'stalled-jobs',
        title: say('screens.adminArea.alertsPanel.jobsThatAlwaysFail'),
        description: say('screens.adminArea.alertsPanel.showsWhenAKindOfJobFailsEveryTime'),
      },
    ],
  },
  {
    title: say('screens.adminArea.alertsPanel.serverResources'),
    alerts: [
      {
        id: 'memory',
        title: say('screens.adminArea.alertsPanel.lowMemory'),
        description: say('screens.adminArea.alertsPanel.showsWhenMemoryIsOverPercentFull', {
          percent: Math.round(ALERT_THRESHOLDS.memoryShare * 100).toString(),
        }),
      },
      {
        id: 'disk',
        title: say('screens.adminArea.alertsPanel.libraryDiskNearlyFull'),
        description: say('screens.adminArea.alertsPanel.showsWhenTheLibraryDiskIsOverPercentFull', {
          percent: Math.round(ALERT_THRESHOLDS.diskShare * 100).toString(),
        }),
      },
      {
        id: 'cpu',
        title: say('screens.adminArea.alertsPanel.highCPU'),
        description: say('screens.adminArea.alertsPanel.showsWhenTheCPUStaysAbovePercent', {
          percent: ALERT_THRESHOLDS.cpuPercent.toString(),
        }),
      },
      {
        id: 'encoder',
        title: say('screens.adminArea.alertsPanel.busyGPUEncoder'),
        description: say('screens.adminArea.alertsPanel.showsWhenTheGPUEncoderStaysAbovePercent', {
          percent: ALERT_THRESHOLDS.encoderPercent.toString(),
        }),
      },
      {
        id: 'artefacts',
        title: say('screens.adminArea.alertsPanel.previewsNotKept'),
        description: say('screens.adminArea.alertsPanel.showsWhenPreviewsAreLostOnRestart'),
      },
    ],
  },
  {
    title: say('common.libraries'),
    alerts: [
      {
        id: 'unreadable-libraries',
        title: say('screens.adminArea.alertsPanel.unreadableLibraries'),
        description: say('screens.adminArea.alertsPanel.showsWhenTheMediaServiceCantReadALibrary'),
      },
      {
        id: 'unscanned',
        title: say('screens.adminArea.alertsPanel.unscannedLibraries'),
        description: say('screens.adminArea.alertsPanel.showsWhenALibraryHasNeverBeenScanned'),
      },
      {
        id: 'no-libraries',
        title: say('screens.adminArea.alertsPanel.noLibraries'),
        description: say('screens.adminArea.alertsPanel.showsWhenTheServerHasNoLibraries'),
      },
      {
        id: 'no-catalogue-key',
        title: say('screens.adminArea.alertsPanel.noCatalogueKey'),
        description: say('screens.adminArea.alertsPanel.showsWhenNoCatalogueKeyIsSet'),
      },
    ],
  },
];

export type { AlertChoice, AlertGroup };

export { ALERT_GROUPS };
