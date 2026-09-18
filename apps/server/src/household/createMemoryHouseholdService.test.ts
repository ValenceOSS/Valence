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
  it('is called whatever the account is called, until somebody says otherwise', async () => {
    const households = createMemoryHouseholdService();

    await expect(households.read(ACCOUNT, 'Dan')).resolves.toMatchObject({ name: 'Dan' });
  });

  it('wears its initial, since nobody has chosen a face', async () => {
    const households = createMemoryHouseholdService();

    await expect(households.read(ACCOUNT, 'Dan')).resolves.toMatchObject({
      avatar: { kind: 'initial' },
    });
  });

  it('is not onboarded, which is the absence of a time rather than a false', async () => {
    const households = createMemoryHouseholdService();

    await households.read(ACCOUNT, 'Dan');

    await expect(households.isOnboarded(ACCOUNT)).resolves.toBe(false);
  });
});

describe('setting a household up', () => {
  it('takes a new name', async () => {
    const households = createMemoryHouseholdService();

    await households.read(ACCOUNT, 'Dan');
    await households.change(ACCOUNT, { name: 'The Morgans' });

    await expect(households.read(ACCOUNT, 'Dan')).resolves.toMatchObject({ name: 'The Morgans' });
  });

  it('is finished only when somebody finishes it', async () => {
    const households = createMemoryHouseholdService();

    await households.read(ACCOUNT, 'Dan');
    await households.change(ACCOUNT, { name: 'Halfway' });

    await expect(households.isOnboarded(ACCOUNT)).resolves.toBe(false);

    await households.finishOnboarding(ACCOUNT);

    await expect(households.isOnboarded(ACCOUNT)).resolves.toBe(true);
  });

  it('keeps a picture, and says the household wears one', async () => {
    const households = createMemoryHouseholdService();

    await households.read(ACCOUNT, 'Dan');

    await expect(
      households.savePhoto(ACCOUNT, { body: await aPicture(), contentType: 'image/png' }),
    ).resolves.toBeNull();

    await expect(households.read(ACCOUNT, 'Dan')).resolves.toMatchObject({
      avatar: { kind: 'photo' },
    });
  });

  it('judges a picture the same way a face is judged', async () => {
    const households = createMemoryHouseholdService();

    await households.read(ACCOUNT, 'Dan');

    await expect(
      households.savePhoto(ACCOUNT, {
        body: new TextEncoder().encode('not a picture'),
        contentType: 'image/png',
      }),
    ).resolves.toBe('unreadable');
  });

  it('has nowhere to put a picture for an account it does not hold', async () => {
    const households = createMemoryHouseholdService();

    await expect(
      households.savePhoto('nobody', { body: await aPicture(), contentType: 'image/png' }),
    ).resolves.toBe('notYours');
  });
});
