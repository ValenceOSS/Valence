import type { Permission } from '@ValenceContracts/schemas/Permission';

const DETAILS: Record<Permission, string> = {
  administrator:
    'Grants every permission there is, including anything added in a later release. Nothing else on this list needs granting alongside it.',

  'library.create': 'Point Valence at a new folder of media and add it as a library.',
  'library.edit':
    'Change a library’s settings — its name, which languages it prefers, how it scans.',
  'library.delete': 'Remove a library and forget everything scanned from it.',

  'jobs.run': 'Start a job, such as a scan, by hand rather than waiting for it to run on its own.',
  'jobs.schedule': 'Change when a recurring job runs, or turn its schedule off.',
  'jobs.runDestructive':
    'Run a reset or a full rebuild — the jobs that throw away what is stored and start again.',

  'media.rescan': 'Ask Valence to read one item again, picking up a file or metadata change.',
  'media.delete': 'Delete a media file from disk, not just from the library.',
  'media.override': 'Correct an item’s metadata by hand when the catalogue matched it wrong.',
  'media.artwork': 'Replace an item’s poster or backdrop with a different picture.',
  'media.hide': 'Hide an item from every profile, not only their own.',

  'sharing.link': 'Create a link that lets somebody outside the household watch one thing.',
  'sharing.party': 'Start a watch party, playing one stream to everybody who joins it.',
  'sharing.manage': 'See every share link anybody has created, and withdraw any of them.',

  'streaming.view': 'See who is watching right now, and what.',
  'streaming.stop': 'End somebody else’s stream.',
  'streaming.pause': 'Pause somebody else’s stream from where they are watching.',
  'streaming.message': 'Send a message that appears over somebody else’s stream.',

  'download.media': 'Save a copy of media to a device, for watching without a connection.',

  'requests.ask': 'Ask for a film or series the server does not have yet.',
  'requests.askMusic': 'Ask for an artist or album the server does not have yet.',
  'requests.autoApprove':
    'Have what they ask for searched for and downloaded without waiting for somebody to approve it.',
  'requests.viewAll': 'See what everybody has asked for, and how each download is getting on.',
  'requests.approve': 'Approve or turn down what other people have asked for.',
  'requests.manage':
    'Set up the indexers, download clients and quality profiles requesting uses, and see the VPN.',

  'account.invite': 'Invite somebody new to sign in and hold an account.',
  'account.manage': 'Rename, suspend or remove an existing account.',
  'account.ban': 'Ban an account, ending its sessions and refusing it a way back in.',
  'account.roles': 'Create roles and choose which permissions each one grants.',
  'account.profiles': 'Add, rename or remove another account’s profiles on their behalf.',
  'account.security':
    'Reset another account’s password, sign it out everywhere, and see where it is signed in.',
  'account.keys':
    'Hold an API key, for reaching Valence from a script or a device outside the browser.',

  'server.settings': 'Change server-wide settings, such as hardware acceleration and quality.',
  'server.backup': 'Start a backup of the server, or restore one.',
  'server.logs': 'Read the server’s log, including entries from before this account signed in.',
  'server.monitor': 'See what the server is doing — its load, its memory, what it is encoding.',
  'server.webhooks': 'Have the server call out to another address when something happens.',
};

/**
 * Says what a permission actually lets somebody do, in a sentence rather than the phrase
 * {@link describePermission} gives — for the moment somebody is deciding whether to grant it, not
 * skimming a list of what a role already holds.
 *
 * @param permission The permission as the server names it.
 */
const describePermissionDetail = (permission: Permission): string => DETAILS[permission];

export { describePermissionDetail };
