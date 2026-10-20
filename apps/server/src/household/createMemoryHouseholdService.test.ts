import { describe, expect, it } from 'vitest';
import sharp from 'sharp';
import { createMemoryHouseholdService } from './createMemoryHouseholdService';

const ACCOUNT = 'usr_1';

const aPicture = async (width = 8, height = 8): Promise<Uint8Array> =>
  new Uint8Array(
    await sharp({ create: { width, height, channels: 3, background: { r: 0, g: 0, b: 0 } } })
      .png()
      .toBuffer(),
  );

describe('a household nobody has set up yet', () => {
  it('holds no name, colour or picture of its own, so its owner stands in for each', async () => {
    const households = createMemoryHouseholdService();

    await expect(households.read(ACCOUNT)).resolves.toMatchObject({
      name: null,
      colour: null,
      avatar: null,
    });
  });

  it('keeps a colour once it chooses one', async () => {
    const households = createMemoryHouseholdService();

    await households.change(ACCOUNT, { colour: '#3ac47d' });

    await expect(households.read(ACCOUNT)).resolves.toMatchObject({ colour: '#3ac47d' });
  });

  it('is not onboarded, which is the absence of a time rather than a false', async () => {
    const households = createMemoryHouseholdService();

    await households.read(ACCOUNT);

    await expect(households.isOnboarded(ACCOUNT)).resolves.toBe(false);
  });
});

describe('setting a household up', () => {
  it('takes a new name', async () => {
    const households = createMemoryHouseholdService();

    await households.read(ACCOUNT);
    await households.change(ACCOUNT, { name: 'The Morgans' });

    await expect(households.read(ACCOUNT)).resolves.toMatchObject({ name: 'The Morgans' });
  });

  it('is finished only when somebody finishes it', async () => {
    const households = createMemoryHouseholdService();

    await households.read(ACCOUNT);
    await households.change(ACCOUNT, { name: 'Halfway' });

    await expect(households.isOnboarded(ACCOUNT)).resolves.toBe(false);

    await households.finishOnboarding(ACCOUNT);

    await expect(households.isOnboarded(ACCOUNT)).resolves.toBe(true);
  });

  it('keeps a picture, and says the household wears one', async () => {
    const households = createMemoryHouseholdService();

    await households.read(ACCOUNT);

    await expect(
      households.savePhoto(ACCOUNT, { body: await aPicture(), contentType: 'image/png' }),
    ).resolves.toBeNull();

    await expect(households.read(ACCOUNT)).resolves.toMatchObject({
      avatar: { kind: 'photo' },
    });
  });

  it('judges a picture the same way a face is judged', async () => {
    const households = createMemoryHouseholdService();

    await households.read(ACCOUNT);

    await expect(
      households.savePhoto(ACCOUNT, {
        body: new TextEncoder().encode('not a picture'),
        contentType: 'image/png',
      }),
    ).resolves.toBe('unreadable');
  });

  it('holds a household for an account it has not seen, the way the database already does', async () => {
    const households = createMemoryHouseholdService();

    await expect(
      households.savePhoto('unseen', { body: await aPicture(), contentType: 'image/png' }),
    ).resolves.toBeNull();

    await expect(households.read('unseen')).resolves.toMatchObject({
      name: null,
      avatar: { kind: 'photo' },
    });
  });

  it('lets go of a name and a picture it chose, so its owner stands in again', async () => {
    const households = createMemoryHouseholdService();

    await households.change('unseen', { name: 'The Morgans' });
    await households.savePhoto('unseen', { body: await aPicture(), contentType: 'image/png' });
    await households.change('unseen', { name: null, avatar: null });

    await expect(households.read('unseen')).resolves.toMatchObject({ name: null, avatar: null });
    await expect(households.readAvatar('unseen')).resolves.toBeNull();
  });
});
