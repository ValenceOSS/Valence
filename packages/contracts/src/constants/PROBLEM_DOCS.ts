import type { ProblemCode } from '@ValenceContracts/schemas/ProblemCode';

const PROBLEM_DOCS: Readonly<Partial<Record<ProblemCode, `/${string}#${string}`>>> = {
  MayNotWriteToLibrary: '/install/requesting#it-may-not-write-to-a-folder',
  CannotSeeDownload: '/install/requesting#a-finished-download-cannot-be-found',
  CloudflareRefusesAddress: '/install/requesting#a-sites-cloudflare-refuses-your-address',
  VpnDown: '/install/requesting#the-vpn-is-down',
  VpnKeyRefused: '/install/requesting#gluetun-refuses-the-key',
  RequestsUnreachable: '/install/requesting#the-requests-service-cannot-be-reached',
  RequestsSecretRefused: '/install/requesting#the-requests-service-refuses-the-secret',
  DownloadClientUnreachable: '/install/requesting#a-download-client-cannot-be-reached',
  DownloadClientLoginRefused: '/install/requesting#a-download-client-refuses-its-login',
};

export { PROBLEM_DOCS };
