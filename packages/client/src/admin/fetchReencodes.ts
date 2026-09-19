import { readFromServer } from '@ValenceClient/query/readFromServer';
import {
  ReencodeEstimateSchema,
  ReencodeListSchema,
  ReencodeStartedSchema,
} from '@ValenceContracts/schemas/Reencode';
import { RenditionListSchema } from '@ValenceContracts/schemas/Rendition';
import type {
  Reencode,
  ReencodeEstimate,
  ReencodeSettings,
  ReencodeStarted,
} from '@ValenceContracts/schemas/Reencode';
import type { Rendition } from '@ValenceContracts/schemas/Rendition';

const SENT_AS_JSON = {
  method: 'POST',
  credentials: 'same-origin',
  headers: { 'content-type': 'application/json' },
} as const;

/**
 * Asks what re-encoding a set of files on these settings would cost, and what it would free.
 *
 * @param mediaIds - The files chosen.
 * @param settings - What was chosen to do to them.
 * @returns The projection, or nothing where the server would not answer.
 */
const fetchReencodeEstimate = async (
  mediaIds: readonly string[],
  settings: ReencodeSettings,
): Promise<ReencodeEstimate | null> => {
  const response = await fetch('/api/reencodes/estimate', {
    ...SENT_AS_JSON,
    body: JSON.stringify({ mediaIds, ...settings }),
  }).catch(() => null);

  if (response === null || !response.ok) {
    return null;
  }

  return ReencodeEstimateSchema.parse(await response.json());
};

/**
 * Queues a set of files to be re-encoded.
 *
 * @param mediaIds - The files chosen.
 * @param settings - What to do to them.
 * @returns What was taken on and what was turned away, or nothing where the server would not answer.
 */
const startReencodes = async (
  mediaIds: readonly string[],
  settings: ReencodeSettings,
): Promise<ReencodeStarted | null> => {
  const response = await fetch('/api/reencodes', {
    ...SENT_AS_JSON,
    body: JSON.stringify({ mediaIds, ...settings }),
  }).catch(() => null);

  if (response === null || !response.ok) {
    return null;
  }

  return ReencodeStartedSchema.parse(await response.json());
};

/**
 * Reads every re-encode, including the ones waiting for somebody to judge them.
 *
 * @returns All of them, oldest first.
 */
const fetchReencodes = async (): Promise<Reencode[]> =>
  (await readFromServer('/api/reencodes', ReencodeListSchema)).reencodes;

/**
 * Reads what has been kept beside an item.
 *
 * @param mediaId - The item.
 * @returns The encodes kept alongside it.
 */
const fetchRenditions = async (mediaId: string): Promise<Rendition[]> =>
  (await readFromServer(`/api/media/${mediaId}/renditions`, RenditionListSchema)).renditions;

/**
 * Accepts a finished encode and disposes of the original it replaced.
 *
 * @param id - The re-encode.
 * @returns Whether the original has gone.
 */
const confirmReencode = async (id: string): Promise<boolean> => {
  const response = await fetch(`/api/reencodes/${id}/confirm`, {
    method: 'POST',
    credentials: 'same-origin',
  }).catch(() => null);

  return response !== null && response.ok;
};

/**
 * Refuses a finished encode and puts the original back, in one action.
 *
 * @param id - The re-encode.
 * @returns Whether the original is back.
 */
const rejectReencode = async (id: string): Promise<boolean> => {
  const response = await fetch(`/api/reencodes/${id}/reject`, {
    method: 'POST',
    credentials: 'same-origin',
  }).catch(() => null);

  return response !== null && response.ok;
};

/**
 * Stops a re-encode that has not finished, and throws away what it had written.
 *
 * @param id - The re-encode.
 * @returns Whether it was stopped.
 */
const cancelReencode = async (id: string): Promise<boolean> => {
  const response = await fetch(`/api/reencodes/${id}`, {
    method: 'DELETE',
    credentials: 'same-origin',
  }).catch(() => null);

  return response !== null && response.ok;
};

/**
 * Asks for a minute at these settings, to be watched before committing hours and an only copy.
 *
 * @param id - The re-encode.
 * @returns Whether the sample is being made.
 */
const sampleReencode = async (id: string): Promise<boolean> => {
  const response = await fetch(`/api/reencodes/${id}/sample`, {
    method: 'POST',
    credentials: 'same-origin',
  }).catch(() => null);

  return response !== null && response.ok;
};

/**
 * Removes an encode kept beside an item, for somebody who did not like it.
 *
 * @param id - The rendition.
 * @returns Whether it has gone.
 */
const removeRendition = async (id: string): Promise<boolean> => {
  const response = await fetch(`/api/renditions/${id}`, {
    method: 'DELETE',
    credentials: 'same-origin',
  }).catch(() => null);

  return response !== null && response.ok;
};

export {
  cancelReencode,
  confirmReencode,
  fetchReencodeEstimate,
  fetchReencodes,
  fetchRenditions,
  rejectReencode,
  removeRendition,
  sampleReencode,
  startReencodes,
};
