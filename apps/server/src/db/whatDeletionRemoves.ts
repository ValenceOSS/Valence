type Owner = 'account' | 'profile' | 'library';

type Fate = 'goesWithIt' | 'outlivesIt' | 'namesItWithoutHoldingIt';

type Rule =
  | 'grantsAccess'
  | 'isPersonal'
  | 'isShared'
  | 'isDerived'
  | 'meansNothingWithoutIt'
  | 'saysWhoDecided'
  | 'isARecordOfWhatHappened';

type OwnedThing = {
  table: string;
  column: string;
  owner: Owner;
  fate: Fate;
  rule: Rule;
};

/**
 * Which of the three things a table belongs to, where it is one of the tables something can belong
 * to at all.
 *
 * @param table - The table's name as the database knows it.
 * @returns The owner, or nothing where deleting that table is not what this file is about.
 */
const ownerOfTable = (table: string): Owner | null => {
  switch (table) {
    case 'user':
      return 'account';
    case 'viewer_profile':
      return 'profile';
    case 'library':
      return 'library';
    default:
      return null;
  }
};

const WHAT_A_RULE_INSISTS_ON: Record<Rule, readonly Fate[]> = {
  grantsAccess: ['goesWithIt'],
  isPersonal: ['goesWithIt'],
  isShared: ['goesWithIt', 'outlivesIt'],
  isDerived: ['goesWithIt', 'outlivesIt'],
  meansNothingWithoutIt: ['goesWithIt'],
  saysWhoDecided: ['outlivesIt', 'namesItWithoutHoldingIt'],
  isARecordOfWhatHappened: ['outlivesIt', 'namesItWithoutHoldingIt'],
};

const NAMES_AN_OWNER = ['userId', 'profileId', 'libraryId', 'referenceId'] as const;

const WHAT_DELETION_REMOVES: readonly OwnedThing[] = [
  {
    table: 'session',
    column: 'userId',
    owner: 'account',
    fate: 'goesWithIt',
    rule: 'grantsAccess',
  },
  {
    table: 'account',
    column: 'userId',
    owner: 'account',
    fate: 'goesWithIt',
    rule: 'grantsAccess',
  },
  {
    table: 'twoFactor',
    column: 'userId',
    owner: 'account',
    fate: 'goesWithIt',
    rule: 'grantsAccess',
  },
  {
    table: 'passkey',
    column: 'userId',
    owner: 'account',
    fate: 'goesWithIt',
    rule: 'grantsAccess',
  },
  {
    table: 'deviceCode',
    column: 'userId',
    owner: 'account',
    fate: 'goesWithIt',
    rule: 'grantsAccess',
  },
  {
    table: 'apikey',
    column: 'referenceId',
    owner: 'account',
    fate: 'goesWithIt',
    rule: 'grantsAccess',
  },
  {
    table: 'share',
    column: 'createdBy',
    owner: 'account',
    fate: 'goesWithIt',
    rule: 'grantsAccess',
  },
  {
    table: 'account_activity',
    column: 'userId',
    owner: 'account',
    fate: 'goesWithIt',
    rule: 'isPersonal',
  },
  {
    table: 'user_profile',
    column: 'userId',
    owner: 'account',
    fate: 'goesWithIt',
    rule: 'isPersonal',
  },
  {
    table: 'viewer_profile',
    column: 'userId',
    owner: 'account',
    fate: 'goesWithIt',
    rule: 'isPersonal',
  },
  {
    table: 'notification',
    column: 'userId',
    owner: 'account',
    fate: 'goesWithIt',
    rule: 'isPersonal',
  },
  {
    table: 'notification_preference',
    column: 'userId',
    owner: 'account',
    fate: 'goesWithIt',
    rule: 'isPersonal',
  },
  {
    table: 'push_subscription',
    column: 'userId',
    owner: 'account',
    fate: 'goesWithIt',
    rule: 'isPersonal',
  },
  {
    table: 'library_block',
    column: 'userId',
    owner: 'account',
    fate: 'goesWithIt',
    rule: 'meansNothingWithoutIt',
  },
  {
    table: 'age_ceiling',
    column: 'userId',
    owner: 'account',
    fate: 'goesWithIt',
    rule: 'meansNothingWithoutIt',
  },
  {
    table: 'age_exception',
    column: 'userId',
    owner: 'account',
    fate: 'goesWithIt',
    rule: 'meansNothingWithoutIt',
  },
  {
    table: 'user_role',
    column: 'userId',
    owner: 'account',
    fate: 'goesWithIt',
    rule: 'meansNothingWithoutIt',
  },
  {
    table: 'user_permission_override',
    column: 'userId',
    owner: 'account',
    fate: 'goesWithIt',
    rule: 'meansNothingWithoutIt',
  },
  {
    table: 'age_exception',
    column: 'grantedBy',
    owner: 'account',
    fate: 'outlivesIt',
    rule: 'saysWhoDecided',
  },
  {
    table: 'media_override',
    column: 'updatedBy',
    owner: 'account',
    fate: 'namesItWithoutHoldingIt',
    rule: 'saysWhoDecided',
  },
  {
    table: 'media_preview_override',
    column: 'updatedBy',
    owner: 'account',
    fate: 'namesItWithoutHoldingIt',
    rule: 'saysWhoDecided',
  },
  {
    table: 'watch_history',
    column: 'profileId',
    owner: 'profile',
    fate: 'goesWithIt',
    rule: 'isPersonal',
  },
  {
    table: 'watch_progress',
    column: 'profileId',
    owner: 'profile',
    fate: 'goesWithIt',
    rule: 'isPersonal',
  },
  {
    table: 'favourite',
    column: 'profileId',
    owner: 'profile',
    fate: 'goesWithIt',
    rule: 'isPersonal',
  },
  {
    table: 'rating',
    column: 'profileId',
    owner: 'profile',
    fate: 'goesWithIt',
    rule: 'isPersonal',
  },
  {
    table: 'hidden',
    column: 'profileId',
    owner: 'profile',
    fate: 'goesWithIt',
    rule: 'isPersonal',
  },
  {
    table: 'reading_progress',
    column: 'profileId',
    owner: 'profile',
    fate: 'goesWithIt',
    rule: 'isPersonal',
  },
  {
    table: 'listening_progress',
    column: 'profileId',
    owner: 'profile',
    fate: 'goesWithIt',
    rule: 'isPersonal',
  },
  {
    table: 'prepared_download',
    column: 'profileId',
    owner: 'profile',
    fate: 'goesWithIt',
    rule: 'isDerived',
  },
  {
    table: 'download_holding',
    column: 'profileId',
    owner: 'profile',
    fate: 'goesWithIt',
    rule: 'isDerived',
  },
  {
    table: 'favourite_artist',
    column: 'profileId',
    owner: 'profile',
    fate: 'goesWithIt',
    rule: 'isPersonal',
  },
  {
    table: 'playlist',
    column: 'profileId',
    owner: 'profile',
    fate: 'outlivesIt',
    rule: 'isShared',
  },
  {
    table: 'media_item',
    column: 'libraryId',
    owner: 'library',
    fate: 'goesWithIt',
    rule: 'meansNothingWithoutIt',
  },
  {
    table: 'reencode_request',
    column: 'libraryId',
    owner: 'library',
    fate: 'goesWithIt',
    rule: 'meansNothingWithoutIt',
  },
  {
    table: 'series',
    column: 'libraryId',
    owner: 'library',
    fate: 'goesWithIt',
    rule: 'meansNothingWithoutIt',
  },
  {
    table: 'music_artist',
    column: 'libraryId',
    owner: 'library',
    fate: 'goesWithIt',
    rule: 'meansNothingWithoutIt',
  },
  {
    table: 'music_album',
    column: 'libraryId',
    owner: 'library',
    fate: 'goesWithIt',
    rule: 'meansNothingWithoutIt',
  },
  {
    table: 'book',
    column: 'libraryId',
    owner: 'library',
    fate: 'goesWithIt',
    rule: 'meansNothingWithoutIt',
  },
  {
    table: 'media_override',
    column: 'libraryId',
    owner: 'library',
    fate: 'goesWithIt',
    rule: 'meansNothingWithoutIt',
  },
  {
    table: 'media_preview_override',
    column: 'libraryId',
    owner: 'library',
    fate: 'goesWithIt',
    rule: 'meansNothingWithoutIt',
  },
  {
    table: 'library_block',
    column: 'libraryId',
    owner: 'library',
    fate: 'goesWithIt',
    rule: 'meansNothingWithoutIt',
  },
  {
    table: 'age_ceiling',
    column: 'libraryId',
    owner: 'library',
    fate: 'goesWithIt',
    rule: 'meansNothingWithoutIt',
  },
  {
    table: 'hidden',
    column: 'libraryId',
    owner: 'library',
    fate: 'goesWithIt',
    rule: 'isPersonal',
  },
  {
    table: 'log_record',
    column: 'libraryId',
    owner: 'library',
    fate: 'namesItWithoutHoldingIt',
    rule: 'isARecordOfWhatHappened',
  },
];

export type { Fate, OwnedThing, Owner, Rule };

export { NAMES_AN_OWNER, ownerOfTable, WHAT_A_RULE_INSISTS_ON, WHAT_DELETION_REMOVES };
