import type { JellyfinItem } from '@ValenceServer/jellyfin/JellyfinDtos';

const JELLYFIN_ITEM_DEFAULTS: Pick<
  JellyfinItem,
  | 'PlayAccess'
  | 'EnableMediaSourceDisplay'
  | 'ImageBlurHashes'
  | 'Tags'
  | 'Studios'
  | 'RemoteTrailers'
  | 'ExternalUrls'
  | 'LockedFields'
  | 'LockData'
> = {
  // oxlint-disable-next-line valence/no-hard-coded-strings -- a Jellyfin field value its apps match on, not words for a person
  PlayAccess: 'Full',
  EnableMediaSourceDisplay: true,
  ImageBlurHashes: {},
  Tags: [],
  Studios: [],
  RemoteTrailers: [],
  ExternalUrls: [],
  LockedFields: [],
  LockData: false,
};

export { JELLYFIN_ITEM_DEFAULTS };
