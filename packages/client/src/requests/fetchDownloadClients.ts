import { z } from 'zod';
import { readFromServer } from '@ValenceClient/query/readFromServer';
import { sendToRequests } from '@ValenceClient/requests/sendToRequests';
import {
  DownloadClientSchema,
  DownloadClientTestSchema,
} from '@ValenceContracts/schemas/DownloadClient';
import type { Refusal } from '@ValenceClient/admin/readRefusal';
import type { Sent } from '@ValenceClient/requests/sendToRequests';
import type {
  DownloadClient,
  DownloadClientChange,
  DownloadClientDraft,
  DownloadClientTest,
} from '@ValenceContracts/schemas/DownloadClient';

const CLIENTS = '/api/admin/requests/clients';

/**
 * Reads the download clients, without their passwords or keys.
 *
 * @returns The clients, in the order releases are offered to them.
 */
const fetchDownloadClients = (): Promise<DownloadClient[]> =>
  readFromServer(CLIENTS, z.array(DownloadClientSchema));

/**
 * Keeps a new download client.
 *
 * @param draft - The client.
 * @returns It as kept, or why not.
 */
const addDownloadClient = (draft: DownloadClientDraft): Promise<Sent<DownloadClient>> =>
  sendToRequests(CLIENTS, 'POST', draft, async (response) =>
    DownloadClientSchema.parse(await response.json()),
  );

/**
 * Changes a kept download client.
 *
 * @param id - Which.
 * @param change - What to change. A password or key left blank is kept as it is.
 * @returns It as changed, or why not.
 */
const changeDownloadClient = (
  id: string,
  change: DownloadClientChange,
): Promise<Sent<DownloadClient>> =>
  sendToRequests(`${CLIENTS}/${id}`, 'PATCH', change, async (response) =>
    DownloadClientSchema.parse(await response.json()),
  );

/**
 * Forgets a download client, and stops following what was sent to it.
 *
 * @param id - Which.
 * @returns Why not, where it was refused.
 */
const removeDownloadClient = async (id: string): Promise<Refusal> =>
  (await sendToRequests(`${CLIENTS}/${id}`, 'DELETE', undefined, () => Promise.resolve(null)))
    .refusal;

/**
 * Asks a kept download client whether it answers.
 *
 * @param id - Which.
 * @returns Whether it answered, or why the question was refused.
 */
const testDownloadClient = (id: string): Promise<Sent<DownloadClientTest>> =>
  sendToRequests(`${CLIENTS}/${id}/test`, 'POST', undefined, async (response) =>
    DownloadClientTestSchema.parse(await response.json()),
  );

/**
 * Asks a download client that is not kept yet, or a change to one that is, whether it answers.
 *
 * @param draft - The client as it stands in the form.
 * @param id - The kept client it changes, whose password is used where the form gives none.
 * @returns Whether it answered, or why the question was refused.
 */
const tryDownloadClient = (
  draft: DownloadClientDraft,
  id?: string,
): Promise<Sent<DownloadClientTest>> =>
  sendToRequests(
    id === undefined ? `${CLIENTS}/try` : `${CLIENTS}/${id}/try`,
    'POST',
    draft,
    async (response) => DownloadClientTestSchema.parse(await response.json()),
  );

export {
  addDownloadClient,
  changeDownloadClient,
  fetchDownloadClients,
  removeDownloadClient,
  testDownloadClient,
  tryDownloadClient,
};
