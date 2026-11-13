import type { PROFILE_COLOURS } from '@ValenceContracts/schemas/ViewerProfile';
import type { StringKey } from '@ValenceI18n/StringKey';

const PROFILE_COLOUR_NAMES = {
  '#e8503a': 'common.red',
  '#e8a33a': 'common.orange',
  '#3ac47d': 'common.green',
  '#3a8ee8': 'common.blue',
  '#8b5ce8': 'common.purple',
  '#e83a90': 'common.pink',
  '#f2c94c': 'common.yellow',
  '#9ccc3a': 'common.lime',
  '#2ec4b6': 'common.teal',
  '#3ac2e8': 'common.skyBlue',
  '#4a5ce8': 'common.indigo',
  '#c45ce8': 'common.violet',
  '#ff8fa3': 'common.rose',
  '#b5835a': 'common.brown',
  '#8a94a6': 'common.grey',
  '#3b4252': 'common.slate',
  '#e6e1d8': 'common.cream',
  '#111418': 'common.black',
} as const satisfies Record<(typeof PROFILE_COLOURS)[number], StringKey>;

export { PROFILE_COLOUR_NAMES };
