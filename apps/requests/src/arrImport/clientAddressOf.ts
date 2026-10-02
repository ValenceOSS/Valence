import type { DownloadClientKind } from '@ValenceContracts/schemas/DownloadClient';
import { fieldsOf } from '@ValenceRequests/arrImport/fieldsOf';
import type { ArrFields } from '@ValenceRequests/arrImport/schemas/ArrFieldsSchema';

/**
 * Where Valence reaches a download client an app is set up with, from the host, port, encryption
 * and URL base it lists: Transmission's straight at its RPC endpoint, so the base it was given is
 * kept, and every other client at its base.
 *
 * @param kind - Which client it is.
 * @param fields - Its settings, as the app lists them.
 * @returns The address, or null where it lists no host.
 */
const clientAddressOf = (kind: DownloadClientKind, fields: ArrFields): string | null => {
  const read = fieldsOf(fields);
  const host = read
    .text('host')
    .replace(/^https?:\/\//i, '')
    .replace(/\/+$/, '');

  if (host === '') {
    return null;
  }

  const port = read.number('port');
  const base = read.text('urlBase').replace(/^\/+|\/+$/g, '');
  const scheme = read.flag('useSsl') ? 'https' : 'http';
  const root = `${scheme}://${host}${port === null ? '' : `:${port.toString()}`}`;

  if (kind === 'transmission') {
    return `${root}/${base === '' ? 'transmission' : base}/rpc`;
  }

  return base === '' ? root : `${root}/${base}`;
};

export { clientAddressOf };
