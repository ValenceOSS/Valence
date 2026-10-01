import { z } from 'zod';
import { readFromServer } from '@ValenceClient/query/readFromServer';
import { sendToRequests } from '@ValenceClient/requests/sendToRequests';
import {
  ArrAppChoicesSchema,
  ArrAppSchema,
  ArrAppTestSchema,
  ArrQueueSchema,
  ProwlarrImportSchema,
} from '@ValenceContracts/schemas/ArrApp';
import type { Refusal } from '@ValenceClient/admin/readRefusal';
import type { Sent } from '@ValenceClient/requests/sendToRequests';
import type {
  ArrApp,
  ArrAppChange,
  ArrAppChoices,
  ArrAppDraft,
  ArrAppTest,
  ArrQueue,
  ProwlarrImport,
} from '@ValenceContracts/schemas/ArrApp';

const APPS = '/api/admin/requests/arr-apps';

/**
 * Reads the connected Radarr, Sonarr, Lidarr and Prowlarr apps, without their keys.
 *
 * @returns The apps.
 */
const fetchArrApps = (): Promise<ArrApp[]> => readFromServer(APPS, z.array(ArrAppSchema));

/**
 * Reads what each connected Radarr, Sonarr and Lidarr has in its queue.
 *
 * @returns The queues.
 */
const fetchArrQueue = (): Promise<ArrQueue> => readFromServer(`${APPS}/queue`, ArrQueueSchema);

/**
 * Reads the root folders and profiles a library handed to an app may choose from.
 *
 * @param id - The app.
 * @returns Its choices.
 */
const fetchArrAppChoices = (id: string): Promise<ArrAppChoices> =>
  readFromServer(`${APPS}/${id}/choices`, ArrAppChoicesSchema);

/**
 * Connects an app.
 *
 * @param draft - The app.
 * @returns It as kept, or why not.
 */
const addArrApp = (draft: ArrAppDraft): Promise<Sent<ArrApp>> =>
  sendToRequests(APPS, 'POST', draft, async (response) =>
    ArrAppSchema.parse(await response.json()),
  );

/**
 * Changes a connected app.
 *
 * @param id - Which.
 * @param change - What to change. A key left blank is kept as it is.
 * @returns It as changed, or why not.
 */
const changeArrApp = (id: string, change: ArrAppChange): Promise<Sent<ArrApp>> =>
  sendToRequests(`${APPS}/${id}`, 'PATCH', change, async (response) =>
    ArrAppSchema.parse(await response.json()),
  );

/**
 * Disconnects an app, and removes the indexers a Prowlarr brought in.
 *
 * @param id - Which.
 * @returns Why not, where it was refused.
 */
const removeArrApp = async (id: string): Promise<Refusal> =>
  (await sendToRequests(`${APPS}/${id}`, 'DELETE', undefined, () => Promise.resolve(null))).refusal;

/**
 * Asks a connected app whether it answers, and remembers how it went.
 *
 * @param id - Which.
 * @returns Whether it answered, or why the question was refused.
 */
const testArrApp = (id: string): Promise<Sent<ArrAppTest>> =>
  sendToRequests(`${APPS}/${id}/test`, 'POST', undefined, async (response) =>
    ArrAppTestSchema.parse(await response.json()),
  );

/**
 * Asks an app that is not connected yet, or a change to one that is, whether it answers.
 *
 * @param draft - The app as it stands in the form.
 * @param id - The kept app it changes, whose key is used where the form gives none.
 * @returns Whether it answered, or why the question was refused.
 */
const tryArrApp = (draft: ArrAppDraft, id?: string): Promise<Sent<ArrAppTest>> =>
  sendToRequests(
    id === undefined ? `${APPS}/try` : `${APPS}/${id}/try`,
    'POST',
    draft,
    async (response) => ArrAppTestSchema.parse(await response.json()),
  );

/**
 * Brings a Prowlarr's indexers in now.
 *
 * @param id - The Prowlarr.
 * @returns How many were added, changed and removed, or why not.
 */
const importArrIndexers = (id: string): Promise<Sent<ProwlarrImport>> =>
  sendToRequests(`${APPS}/${id}/import-indexers`, 'POST', undefined, async (response) =>
    ProwlarrImportSchema.parse(await response.json()),
  );

export {
  addArrApp,
  changeArrApp,
  fetchArrAppChoices,
  fetchArrApps,
  fetchArrQueue,
  importArrIndexers,
  removeArrApp,
  testArrApp,
  tryArrApp,
};
