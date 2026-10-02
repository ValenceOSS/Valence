import type { DownloadClientKind } from '@ValenceContracts/schemas/DownloadClient';

const CLIENT_KINDS: Readonly<Record<string, DownloadClientKind>> = {
  QBittorrent: 'qbittorrent',
  Transmission: 'transmission',
  Sabnzbd: 'sabnzbd',
  Nzbget: 'nzbget',
};

export { CLIENT_KINDS };
