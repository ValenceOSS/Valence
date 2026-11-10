import type { AdminOverview } from '@ValenceClient/admin/fetchAdmin';

/**
 * An admin overview for a test: a server with one admin, no keys and every setting at its default,
 * with any setting changed as asked.
 *
 * @param overrides - The settings to change.
 * @returns The overview.
 */
const anAdminOverview = (overrides: Partial<AdminOverview['settings']> = {}): AdminOverview => ({
  users: [{ id: 'usr_1', name: 'Dan', email: 'dan@valence.local', role: 'admin', createdAt: '' }],
  settings: {
    hasCatalogueKey: false,
    hasAudioDbKey: false,
    hasOmdbKey: false,
    hasFanartKey: false,
    cookieSecure: false,
    trustedOrigins: ['http://localhost:8420'],
    hardwareAccel: '',
    spreadAcrossDevices: false,
    hardwareDevices: [],
    whenDevicesFull: 'software' as const,
    previewQuality: 'high' as const,
    usesKeyframeThumbnails: false,
    showsProfilesBeforeSignIn: false,
    fetchesCatalogueTrailers: false,
    playsCatalogueTrailers: false,
    usesShortSegments: true,
    playsEpisodesGapless: true,
    fetchesMusicDetails: false,
    requestReleaseTypes: ['album'],
    controlsConnectedApps: false,
    roundness: 'default' as const,
    certificationRegion: 'GB',
    keepsDownloadsForDays: 14,
    hiddenAlerts: [],
    telemetryEnabled: true,
    usesPushRelay: false,
    isTelemetryOffByEnvironment: false,
    splashscreen: null,
    ...overrides,
  },
  transcoder: {
    isReachable: true,
    address: 'unix:/tmp/valence-transcoder.sock',
    ffmpegVersion: null,
    ffmpegSupported: true,
    hardwareAccels: [],
    concurrentRenders: 0,
    toneMapping: 'unavailable' as const,
    hardwareToneMaps: [],
    unreadableLibraries: [],
    chains: [],
  },
  hardware: null,
  library: { itemCount: 0, libraryCount: 0, bytes: 0 },
  artwork: null,
  bookPages: null,
  jobs: { stalled: [] },
  playback: { stoppedLastDay: 0 },
});

export { anAdminOverview };
