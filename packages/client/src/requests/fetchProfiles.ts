import { z } from 'zod';
import { readFromServer } from '@ValenceClient/query/readFromServer';
import { sendToRequests } from '@ValenceClient/requests/sendToRequests';
import {
  ProfilesOnOfferSchema,
  QualityProfileSchema,
} from '@ValenceContracts/schemas/QualityProfile';
import type { Refusal } from '@ValenceClient/admin/readRefusal';
import type { Sent } from '@ValenceClient/requests/sendToRequests';
import type { MediaRequestKind } from '@ValenceContracts/schemas/MediaRequest';
import type {
  ProfilesOnOffer,
  QualityProfile,
  QualityProfileChange,
  QualityProfileDraft,
} from '@ValenceContracts/schemas/QualityProfile';

const PROFILES = '/api/admin/requests/profiles';

const ON_OFFER = '/api/requests/profiles';

/**
 * Reads the qualities somebody may ask at for something, and the one they are given no say over.
 *
 * Asked by what is being requested rather than by kind of profile, because the answer depends on
 * the library it would be filed into, and only the server knows which that is.
 *
 * @param kind - What is being asked for.
 * @returns What to offer, and whichever profile overrides the offer.
 */
const fetchProfilesOnOffer = (kind: MediaRequestKind): Promise<ProfilesOnOffer> =>
  readFromServer(`${ON_OFFER}?kind=${kind}`, ProfilesOnOfferSchema);

/**
 * Reads the quality profiles searches are judged against.
 *
 * @returns The profiles, in the operator's order, highest first.
 */
const fetchProfiles = (): Promise<QualityProfile[]> =>
  readFromServer(PROFILES, z.array(QualityProfileSchema));

/**
 * Keeps a new quality profile.
 *
 * @param draft - The profile.
 * @returns It as kept, or why not.
 */
const addProfile = (draft: QualityProfileDraft): Promise<Sent<QualityProfile>> =>
  sendToRequests(PROFILES, 'POST', draft, async (response) =>
    QualityProfileSchema.parse(await response.json()),
  );

/**
 * Changes a kept quality profile.
 *
 * @param id - Which.
 * @param change - What to change.
 * @returns It as changed, or why not.
 */
const changeProfile = (id: string, change: QualityProfileChange): Promise<Sent<QualityProfile>> =>
  sendToRequests(`${PROFILES}/${id}`, 'PATCH', change, async (response) =>
    QualityProfileSchema.parse(await response.json()),
  );

/**
 * Puts the quality profiles in order, highest first.
 *
 * @param ids - The profiles, in their new order.
 * @returns Every profile in its new order, or why not.
 */
const reorderProfiles = (ids: readonly string[]): Promise<Sent<QualityProfile[]>> =>
  sendToRequests(`${PROFILES}/order`, 'PUT', { ids }, async (response) =>
    z.array(QualityProfileSchema).parse(await response.json()),
  );

/**
 * Forgets a quality profile.
 *
 * @param id - Which.
 * @returns Why not, where it was refused.
 */
const removeProfile = async (id: string): Promise<Refusal> =>
  (await sendToRequests(`${PROFILES}/${id}`, 'DELETE', undefined, () => Promise.resolve(null)))
    .refusal;

export {
  addProfile,
  changeProfile,
  fetchProfiles,
  fetchProfilesOnOffer,
  removeProfile,
  reorderProfiles,
};
