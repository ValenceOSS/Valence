import { describeJobKind } from '@ValenceClient/admin/describeJobKind';
import { describePermission } from '@ValenceClient/admin/describePermission';
import { describeWords } from '@ValenceClient/admin/describeWords';
import { PermissionSchema } from '@ValenceContracts/schemas/Permission';
import type { AuditEntry } from '@ValenceContracts/schemas/Audit';
import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';

const NAMED_SETTINGS: Readonly<Record<string, string>> = {
  catalogueApiKey: say('screens.adminArea.settingsPanel.catalogueKey'),
  audioDbKey: say('screens.adminArea.settingsPanel.theAudioDBKey'),
  omdbKey: say('screens.adminArea.settingsPanel.oMDbKey'),
  hardwareAccel: say('screens.adminArea.settingsPanel.hardwareAcceleration'),
  previewQuality: say('screens.adminArea.settingsPanel.previewQuality'),
  certificationRegion: say('screens.adminArea.settingsPanel.ageCertificates'),
  showsProfilesBeforeSignIn: say('screens.adminArea.settingsPanel.showWhoLivesHere'),
  allowedApps: say('screens.adminArea.settingsPanel.appsThatCanSignIn'),
  fetchesCatalogueTrailers: say('screens.adminArea.settingsPanel.fetchTrailersFromTheCatalogue'),
  usesShortSegments: say('screens.adminArea.settingsPanel.shortSegments'),
  fetchesMusicDetails: say('screens.adminArea.settingsPanel.fetchMusicDetailsFromTheWeb'),
  controlsConnectedApps: say('screens.adminArea.arrAppsPanel.connectedApps'),
  roundness: say('screens.adminArea.settingsPanel.roundness'),
  keepsDownloadsForDays: say('screens.adminArea.settingsPanel.preparedDownloads'),
  wayInMessage: say('screens.adminArea.wayInMessageRow.messageOnTheWayIn'),
  email: say('common.email'),
  subtitles: say('common.subtitles'),
  preTranscoding: say('common.preTranscoding'),
  brand: say('screens.adminArea.brandCard.yourOwnBrand'),
  logo: say('screens.adminArea.artworkPicker.logo'),
  announcement: say('screens.announcementBanner.announcement'),
  splashscreen: say('screens.adminArea.settingsPanel.pictureBehindTheWayIn'),
  preRoll: say('screens.adminArea.preRollCard.preRoll'),
  storage: say('screens.adminArea.storage'),
};

const NAMED_FIELDS: Readonly<Record<string, string>> = {
  name: say('common.name'),
  username: say('common.username'),
  email: say('common.email'),
  discordId: say('screens.adminArea.webhookFields.discord'),
  libraries: say('common.libraries'),
};

const NAMED_ARTWORK: Readonly<Record<string, string>> = {
  poster: say('screens.adminArea.artworkPicker.poster'),
  backdrop: say('screens.adminArea.artworkPicker.backdrop'),
  logo: say('screens.adminArea.artworkPicker.logo'),
};

const WAYS_IN: Readonly<Record<string, string>> = {
  password: say('screens.admin.describeAuditDetail.withAPassword'),
  passkey: say('screens.admin.describeAuditDetail.withAPasskey'),
  twoFactor: say('screens.admin.describeAuditDetail.withATwoFactorCode'),
  deviceCode: say('screens.admin.describeAuditDetail.withACodeFromAnotherDevice'),
  link: say('screens.admin.describeAuditDetail.withASignInLink'),
};

const LISTED = new Intl.ListFormat('en', { style: 'long', type: 'conjunction' });

/**
 * Names each of a list of things an entry changed, by the names the admin area gives them.
 *
 * @param listed - The things, as the server wrote them.
 * @param names - What each is called, where it has a name.
 * @returns Their names, as one list.
 */
const namesOf = (listed: string, names: Readonly<Record<string, string>>): string =>
  LISTED.format(
    listed
      .split(',')
      .map((one) => one.trim())
      .filter((one) => one !== '')
      .map((one) => names[one] ?? describeWords(one)),
  );

/**
 * Says what a permission set for one account now does.
 *
 * @param permission - The permission, as the server wrote it.
 * @param effect - Whether it was allowed, taken away or handed back to the account's roles.
 * @returns What happened to it.
 */
const describeOverride = (permission: string, effect: string | undefined): string => {
  const known = PermissionSchema.safeParse(permission);
  const named = known.success ? describePermission(known.data) : describeWords(permission);

  if (effect === 'allow') {
    return say('screens.admin.describeAuditDetail.permissionAllowed', { permission: named });
  }

  return effect === 'deny'
    ? say('screens.admin.describeAuditDetail.permissionRefused', { permission: named })
    : say('screens.admin.describeAuditDetail.permissionFromRoles', { permission: named });
};

/**
 * Puts what an audit entry kept about a change into the few short things the log shows under it:
 * where a title is and which episode, how somebody signed in, which settings moved, why a request
 * was refused. Anything the log does not know how to say is left out rather than shown as a code.
 *
 * @param entry - The entry.
 * @param jobLabels - What the server calls each kind of job, for an entry about one.
 * @returns What to show, in order.
 */
const describeAuditDetail = (
  entry: AuditEntry,
  jobLabels: ReadonlyMap<string, string> = new Map(),
): string[] => {
  const detail = entry.detail ?? {};
  const said: string[] = [];
  const files = Number(detail['files']);
  const attempts = Number(detail['attempts']);

  if (detail['method'] !== undefined && WAYS_IN[detail['method']] !== undefined) {
    said.push(WAYS_IN[detail['method']] ?? '');
  }

  if (Number.isInteger(attempts) && attempts > 1) {
    said.push(sayCount('screens.admin.describeAuditDetail.attempts', attempts));
  }

  if (detail['job'] !== undefined) {
    said.push(describeJobKind(detail['job'], jobLabels));
  }

  if (detail['episodeTitle'] !== undefined) {
    said.push(
      say('screens.admin.describeAuditDetail.calledTitle', { title: detail['episodeTitle'] }),
    );
  }

  if (detail['season'] !== undefined && detail['episode'] !== undefined) {
    said.push(
      say('screens.admin.describeAuditDetail.seasonAndEpisode', {
        season: detail['season'],
        episode: detail['episode'],
      }),
    );
  } else if (detail['season'] !== undefined) {
    said.push(say('common.seasonSeasonNumber', { seasonNumber: detail['season'] }));
  }

  if (detail['year'] !== undefined) {
    said.push(say('screens.admin.describeAuditDetail.fromYear', { year: detail['year'] }));
  }

  if (detail['version'] !== undefined) {
    said.push(
      entry.action.startsWith('plugin.')
        ? detail['version']
        : say('screens.admin.describeAuditDetail.versionVersion', { version: detail['version'] }),
    );
  }

  if (entry.action.startsWith('media.artwork') && detail['kind'] !== undefined) {
    said.push(NAMED_ARTWORK[detail['kind']] ?? describeWords(detail['kind']));
  }

  if (detail['catalogueId'] !== undefined) {
    said.push(
      say('screens.admin.describeAuditDetail.nowCatalogueEntry', { id: detail['catalogueId'] }),
    );
  }

  if (detail['to'] !== undefined) {
    said.push(
      entry.action === 'media.moved'
        ? say('screens.admin.describeAuditDetail.toLibrary', { library: detail['to'] })
        : detail['to'],
    );
  }

  if (detail['path'] !== undefined) {
    said.push(detail['path']);
  }

  if (detail['library'] !== undefined && detail['library'] !== '') {
    said.push(say('screens.admin.describeAuditDetail.inLibrary', { library: detail['library'] }));
  }

  if (detail['account'] !== undefined) {
    said.push(
      say('screens.admin.describeAuditDetail.onTheAccountOfName', { name: detail['account'] }),
    );
  }

  if (detail['settings'] !== undefined) {
    said.push(namesOf(detail['settings'], NAMED_SETTINGS));
  }

  if (detail['fields'] !== undefined) {
    said.push(namesOf(detail['fields'], NAMED_FIELDS));
  }

  if (detail['permission'] !== undefined) {
    said.push(describeOverride(detail['permission'], detail['effect']));
  }

  if (detail['enabled'] !== undefined) {
    said.push(
      detail['enabled'] === 'true'
        ? say('screens.admin.describeAuditDetail.keyTurnedOn')
        : say('screens.admin.describeAuditDetail.keyTurnedOff'),
    );
  }

  if (detail['host'] !== undefined && detail['host'] !== '') {
    said.push(say('screens.admin.describeAuditDetail.sendsToHost', { host: detail['host'] }));
  }

  if (detail['watcher'] !== undefined) {
    said.push(say('screens.admin.describeAuditDetail.watchedByName', { name: detail['watcher'] }));
  }

  if (detail['device'] !== undefined) {
    said.push(say('screens.admin.describeAuditDetail.onDevice', { device: detail['device'] }));
  }

  if (detail['force'] === 'true') {
    said.push(say('screens.admin.describeAuditDetail.everyFileReadAgain'));
  }

  if (detail['files'] === 'deleted') {
    said.push(say('screens.admin.describeAuditDetail.filesDeletedToo'));
  } else if (Number.isInteger(files) && files > 0) {
    said.push(sayCount('common.count.files', files));
  }

  if (detail['reason'] !== undefined && detail['reason'] !== '') {
    said.push(say('screens.admin.describeAuditDetail.becauseReason', { reason: detail['reason'] }));
  }

  return said.filter((one) => one !== '');
};

export { describeAuditDetail };
