import { z } from 'zod';
import { readFromServer } from '@ValenceClient/query/readFromServer';
import { sendToRequests } from '@ValenceClient/requests/sendToRequests';
import {
  ProfilesOnOfferSchema,
  QualityProfileSchema,
} from '@ValenceContracts/schemas/QualityProfile';
import type { Refusal } from '@ValenceClient/admin/readRefusal';
import type { Sent } from '@ValenceClient/requests/sendToRequests';
import type {
  ProfileKind,
  ProfilesOnOffer,
  QualityProfile,
  QualityProfileChange,
  QualityProfileDraft,
} from '@ValenceContracts/schemas/QualityProfile';

const PROFILES = '/api/admin/requests/profiles';

const ON_OFFER = '/api/requests/profiles';

/**
 * Reads the qualities somebody may ask at, and the one they are given no say over.
 *
 * Not the admin list: that is every profile on the server, and what is wanted here is the few a
 * particular person may choose between.
 *
 * @param kind - Whether the request is for music or for video.
 * @returns What to offer, and whichever profile overrides the offer.
 */
const fetchProfilesOnOffer = (kind: ProfileKind): Promise<ProfilesOnOffer> =>
  readFromServer(`${ON_OFFER}?kind=${kind}`, ProfilesOnOfferSchema);

/**
 * Reads the quality profiles searches are judged against.
 *
 * @returns The profiles, by name.
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
 * Forgets a quality profile.
 *
 * @param id - Which.
 * @returns Why not, where it was refused.
 */
const removeProfile = async (id: string): Promise<Refusal> =>
  (await sendToRequests(`${PROFILES}/${id}`, 'DELETE', undefined, () => Promise.resolve(null)))
    .refusal;

export { addProfile, changeProfile, fetchProfiles, fetchProfilesOnOffer, removeProfile };
