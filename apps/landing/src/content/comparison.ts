type ComparisonRow = {
  label: string;
  plex: string;
  jellyfin: string;
  valence: string;
};

const COMPARISON_ROWS: ComparisonRow[] = [
  { label: 'Source', plex: 'Closed', jellyfin: 'Open (GPL)', valence: 'Open (MIT)' },
  {
    label: 'Phones home',
    plex: 'Yes, a plex.tv account',
    jellyfin: 'No',
    valence: 'No',
  },
  {
    label: 'Hardware transcoding',
    plex: 'Yes, some behind Plex Pass',
    jellyfin: 'Yes',
    valence: 'Yes, free, AV1 on several backends',
  },
  {
    label: 'HDR tone-mapping',
    plex: 'Yes, behind Plex Pass',
    jellyfin: 'Yes',
    valence: 'Yes',
  },
  {
    label: 'Watch together',
    plex: 'Yes',
    jellyfin: 'Via SyncPlay',
    valence: 'Yes, password-protectable',
  },
  {
    label: 'Book reading',
    plex: 'Removed in 2022',
    jellyfin: 'Plugin only',
    valence: 'Built in',
  },
  {
    label: 'Offline downloads',
    plex: 'Behind Plex Pass',
    jellyfin: 'Via apps',
    valence: 'Built in, including a full offline mode',
  },
  {
    label: 'Plugin ecosystem',
    plex: 'Closed, mostly deprecated',
    jellyfin: 'Mature, community',
    valence: 'Capability-scoped API, in progress',
  },
  {
    label: 'Documented public API',
    plex: 'Reverse-engineered',
    jellyfin: 'Partial',
    valence: 'Full OpenAPI 3.1, hosted reference',
  },
  {
    label: '2FA / passkeys',
    plex: '2FA only',
    jellyfin: 'Basic auth',
    valence: 'TOTP 2FA and WebAuthn passkeys',
  },
  { label: 'Price', plex: 'Free tier, plus a subscription', jellyfin: 'Free', valence: 'Free' },
];

export type { ComparisonRow };

export { COMPARISON_ROWS };
