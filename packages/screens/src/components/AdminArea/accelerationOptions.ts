import { say } from '@ValenceI18n/say';

const accelerationOptions = [
  {
    id: '',
    label: say('common.automatic'),
    detail: say('screens.adminArea.accelerationOptions.useWhicheverTheMachineProvesIt'),
  },
  {
    id: 'vaapi',
    label: say('screens.adminArea.accelerationOptions.vAAPI'),
    detail: say('screens.adminArea.accelerationOptions.intelAndAMDOnLinux'),
  },
  { id: 'qsv', label: 'QuickSync', detail: say('screens.adminArea.accelerationOptions.intel') },
  {
    id: 'nvenc',
    label: say('screens.adminArea.accelerationOptions.nVENC'),
    detail: say('screens.adminArea.accelerationOptions.nVIDIA'),
  },
  {
    id: 'amf',
    label: say('screens.adminArea.accelerationOptions.aMF'),
    detail: say('screens.adminArea.accelerationOptions.aMDNeedsTheProprietaryDriver'),
  },
  {
    id: 'videotoolbox',
    label: 'VideoToolbox',
    detail: say('screens.adminArea.accelerationOptions.apple'),
  },
  {
    id: 'rkmpp',
    label: say('screens.adminArea.accelerationOptions.rKMPP'),
    detail: say('screens.adminArea.accelerationOptions.rockchip'),
  },
  {
    id: 'mediafoundation',
    label: say('screens.adminArea.accelerationOptions.mediaFoundation'),
    detail: say('screens.adminArea.accelerationOptions.qualcommOnWindows'),
  },
  {
    id: 'none',
    label: say('common.softwareOnly'),
    detail: say('screens.adminArea.accelerationOptions.neverUseTheHardware'),
  },
];

export { accelerationOptions };
