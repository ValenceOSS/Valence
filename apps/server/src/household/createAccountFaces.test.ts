import { describe, expect, it } from 'vitest';
import sharp from 'sharp';
import { createMemoryProfileService } from '@ValenceServer/profiles/createMemoryProfileService';
import { createAccountFaces } from './createAccountFaces';
import { createMemoryHouseholdService } from './createMemoryHouseholdService';

const ACCOUNT = 'usr_dan';

/**
 * A small picture anybody would accept.
 *
 * @returns The picture.
 */
const aPicture = async () => ({
  body: new Uint8Array(
    await sharp({ create: { width: 8, height: 8, channels: 3, background: { r: 0, g: 0, b: 0 } } })
      .png()
      .toBuffer(),
  ),
  contentType: 'image/png',
});

/**
 * An account with as many profiles as asked for, the first of them its owner.
 *
 * @param names - Who watches on it.
 * @returns The faces, and the stores underneath them.
 */
const anAccount = async (...names: string[]) => {
  const households = createMemoryHouseholdService();
  const profiles = createMemoryProfileService();

  for (const name of names) {
    await profiles.create(ACCOUNT, { name, colour: '#8b5ce8' });
  }

  return { faces: createAccountFaces({ households, profiles }), households, profiles };
};

describe('an account one person watches on', () => {
  it('is that person, named and drawn as their profile is', async () => {
    const { faces } = await anAccount('Dan');

    await expect(faces.read(ACCOUNT, 'dcm')).resolves.toMatchObject({
      name: 'Dan',
      colour: '#8b5ce8',
      hasOwnPicture: false,
    });
  });

  it('puts a new name and picture on the profile, not beside it', async () => {
    const { faces, profiles, households } = await anAccount('Dan');

    await expect(faces.change(ACCOUNT, { name: 'Daniel' })).resolves.toBe('changed');
    await expect(faces.savePhoto(ACCOUNT, await aPicture())).resolves.toBeNull();

    const [owner] = await profiles.list(ACCOUNT);

    expect(owner).toMatchObject({ name: 'Daniel', avatar: { kind: 'photo' } });
    await expect(households.read(ACCOUNT)).resolves.toMatchObject({ name: null, avatar: null });
    await expect(faces.readPicture(ACCOUNT)).resolves.not.toBeNull();
  });

  it('wears a new picture even where the profile was drawn some other way before', async () => {
    const { faces, profiles } = await anAccount('Dan');
    const [owner] = await profiles.list(ACCOUNT);

    await profiles.rename(ACCOUNT, owner?.id ?? '', {
      name: 'Dan',
      colour: '#8b5ce8',
      avatar: { kind: 'drawn', style: 'bottts', seed: 'dan' },
    });
    await faces.savePhoto(ACCOUNT, await aPicture());

    await expect(faces.read(ACCOUNT, 'dcm')).resolves.toMatchObject({
      avatar: { kind: 'photo', isVideo: false },
    });
  });

  it('refuses a name longer than a profile may have', async () => {
    const { faces } = await anAccount('Dan');

    await expect(faces.change(ACCOUNT, { name: 'a'.repeat(30) })).resolves.toBe('tooLong');
  });
});

describe('an account several people watch on', () => {
  it('follows its owner until it chooses something of its own', async () => {
    const { faces } = await anAccount('Dan', 'Dad');

    await expect(faces.read(ACCOUNT, 'dcm')).resolves.toMatchObject({
      name: 'Dan',
      hasOwnName: false,
      hasOwnPicture: false,
    });
  });

  it('keeps a name and picture of its own, leaving the owner profile alone', async () => {
    const { faces, profiles } = await anAccount('Dan', 'Dad');

    await faces.change(ACCOUNT, { name: 'The Morgans' });
    await faces.savePhoto(ACCOUNT, await aPicture());

    await expect(faces.read(ACCOUNT, 'dcm')).resolves.toMatchObject({
      name: 'The Morgans',
      avatar: { kind: 'photo' },
      hasOwnName: true,
      hasOwnPicture: true,
    });
    await expect(profiles.list(ACCOUNT)).resolves.toMatchObject([
      { name: 'Dan', avatar: { kind: 'initial' } },
      { name: 'Dad' },
    ]);
  });

  it('goes back to following its owner when it clears what it chose', async () => {
    const { faces } = await anAccount('Dan', 'Dad');

    await faces.change(ACCOUNT, { name: 'The Morgans' });
    await faces.savePhoto(ACCOUNT, await aPicture());
    await faces.change(ACCOUNT, { name: null, avatar: null });

    await expect(faces.read(ACCOUNT, 'dcm')).resolves.toMatchObject({
      name: 'Dan',
      hasOwnName: false,
      hasOwnPicture: false,
    });
  });

  it('keeps no name of its own when it is given its owner’s', async () => {
    const { faces } = await anAccount('Dan', 'Dad');

    await faces.change(ACCOUNT, { name: 'Dan' });

    await expect(faces.read(ACCOUNT, 'dcm')).resolves.toMatchObject({ hasOwnName: false });
  });

  it('forgets everything it chose, so a later second profile starts out following the owner', async () => {
    const { faces, households } = await anAccount('Dan', 'Dad');

    await faces.change(ACCOUNT, { name: 'The Morgans' });
    await faces.forgetOwn(ACCOUNT);

    await expect(households.read(ACCOUNT)).resolves.toMatchObject({
      name: null,
      colour: null,
      avatar: null,
    });
  });
});
