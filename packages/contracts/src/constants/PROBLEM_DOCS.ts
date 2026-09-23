import type { ProblemCode } from '@ValenceContracts/schemas/ProblemCode';

const PROBLEM_DOCS = {
  MayNotWriteToLibrary: '/install/requesting#who-owns-what-it-files',
  CannotSeeDownload: '/install/requesting#paths-must-line-up',
  CloudflareRefusesAddress: '/install/requesting#indexers-behind-cloudflare',
  CloudflareCheckFailed: '/install/requesting#indexers-behind-cloudflare',
  IndexerFailing: '/install/requesting#failing-indexers',
  VpnDown: '/install/requesting#a-vpn-for-the-download-client',
  VpnKeyRefused: '/install/requesting#a-vpn-for-the-download-client',
  RequestsUnreachable: '/install/requesting#switching-it-on',
  RequestsSecretRefused: '/install/requesting#switching-it-on',
  DownloadClientUnreachable: '/install/requesting#download-clients',
  DownloadClientLoginRefused: '/install/requesting#download-clients',
} as const satisfies Record<ProblemCode, `/${string}#${string}`>;

export { PROBLEM_DOCS };
