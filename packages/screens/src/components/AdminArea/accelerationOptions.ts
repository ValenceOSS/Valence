import type { StringKey } from '@ValenceI18n/StringKey';

const accelerationOptions: readonly { id: string; labelKey: StringKey; detailKey: StringKey }[] = [
  {
    id: '',
    labelKey: 'admin.accelerationOptions.automatic',
    detailKey: 'admin.accelerationOptions.automaticDetail',
  },
  {
    id: 'vaapi',
    labelKey: 'admin.accelerationOptions.vaapi',
    detailKey: 'admin.accelerationOptions.vaapiDetail',
  },
  {
    id: 'qsv',
    labelKey: 'admin.accelerationOptions.qsv',
    detailKey: 'admin.accelerationOptions.qsvDetail',
  },
  {
    id: 'nvenc',
    labelKey: 'admin.accelerationOptions.nvenc',
    detailKey: 'admin.accelerationOptions.nvencDetail',
  },
  {
    id: 'amf',
    labelKey: 'admin.accelerationOptions.amf',
    detailKey: 'admin.accelerationOptions.amfDetail',
  },
  {
    id: 'videotoolbox',
    labelKey: 'admin.accelerationOptions.videotoolbox',
    detailKey: 'admin.accelerationOptions.videotoolboxDetail',
  },
  {
    id: 'rkmpp',
    labelKey: 'admin.accelerationOptions.rkmpp',
    detailKey: 'admin.accelerationOptions.rkmppDetail',
  },
  {
    id: 'none',
    labelKey: 'admin.accelerationOptions.none',
    detailKey: 'admin.accelerationOptions.noneDetail',
  },
];

export { accelerationOptions };
