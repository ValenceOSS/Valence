import { PROFILE_COLOURS } from '@ValenceContracts/schemas/ViewerProfile';
import type { ViewerProfile } from '@ValenceContracts/schemas/ViewerProfile';
import { PLUS_JAKARTA_SANS_AS_STORED } from '@ValenceContracts/schemas/LetterFont';
import type { Askable } from './whoCanBeAsked';

type AskableFace = Pick<ViewerProfile, 'id' | 'name' | 'colour' | 'avatar' | 'updatedAt'> & {
  pictureUrl?: string | undefined;
};

/**
 * The face to draw beside somebody who could be asked along: their profile's own where this server
 * has one, read from wherever the server keeps it, which for an account of several profiles is the
 * household's picture, and their initial on the first colour where it has not, as for somebody from
 * a linked server.
 *
 * @param person - Who could be asked.
 * @returns What a face draws them from.
 */
const faceOfAskable = (person: Askable): AskableFace => ({
  id: person.id,
  name: person.name,
  colour: person.colour ?? PROFILE_COLOURS[0],
  avatar: person.avatar ?? { kind: 'initial', font: PLUS_JAKARTA_SANS_AS_STORED },
  updatedAt: person.updatedAt ?? '',
  pictureUrl: person.pictureUrl,
});

export type { AskableFace };

export { faceOfAskable };
