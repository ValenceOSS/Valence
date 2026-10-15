import { describe, expect, it } from 'vitest';
import sharp from 'sharp';
import { createMemoryProfileService } from './createMemoryProfileService';

const REQUEST = { name: 'Sam', colour: '#3ac47d' } as const;

const aPicture = async (width = 8, height = 8): Promise<Uint8Array> =>
  new Uint8Array(
    await sharp({
      create: { width, height, channels: 3, background: { r: 0, g: 0, b: 0 } },
    })
      .png()
      .toBuffer(),
  );

describe('createMemoryProfileService', () => {
  it('has nobody on an account nobody has used', async () => {
    const profiles = createMemoryProfileService();

    await expect(profiles.list('marques')).resolves.toEqual([]);
  });

  it('makes a profile for an account that has none', async () => {
    const profiles = createMemoryProfileService();

    const made = await profiles.ensureDefault('marques', 'Marques');

    expect(made.name).toBe('Marques');
  });

  it('does not make a second one for an account that has one', async () => {
    const profiles = createMemoryProfileService();

    const first = await profiles.ensureDefault('marques', 'Marques');
    const again = await profiles.ensureDefault('marques', 'Marques');

    expect(again.id).toBe(first.id);
  });

  it('adds somebody to an account', async () => {
    const profiles = createMemoryProfileService();

    await profiles.ensureDefault('marques', 'Marques');
    await profiles.create('marques', REQUEST);

    await expect(profiles.list('marques')).resolves.toHaveLength(2);
  });

  it('keeps the people of one account out of another', async () => {
    const profiles = createMemoryProfileService();

    await profiles.create('marques', REQUEST);

    await expect(profiles.list('somebody-else')).resolves.toEqual([]);
  });

  it('changes what somebody is called', async () => {
    const profiles = createMemoryProfileService();
    const made = await profiles.create('marques', REQUEST);

    await profiles.rename('marques', made.id, { name: 'Samuel', colour: '#3ac47d' });

    await expect(profiles.list('marques')).resolves.toMatchObject([{ name: 'Samuel' }]);
  });

  it('changes when a profile last changed, since its picture is addressed by that', async () => {
    const profiles = createMemoryProfileService();
    const made = await profiles.create('marques', REQUEST);

    await profiles.rename('marques', made.id, { name: 'Samuel', colour: '#3ac47d' });

    const [changed] = await profiles.list('marques');

    expect(changed?.updatedAt).not.toBe(made.updatedAt);
  });

  it('will not let one account rename a profile held by another', async () => {
    const profiles = createMemoryProfileService();
    const made = await profiles.create('marques', REQUEST);

    await expect(
      profiles.rename('somebody-else', made.id, { name: 'Mine', colour: '#3ac47d' }),
    ).resolves.toBe(false);
  });

  it('removes somebody', async () => {
    const profiles = createMemoryProfileService();

    await profiles.ensureDefault('marques', 'Marques');

    const made = await profiles.create('marques', REQUEST);

    await profiles.remove('marques', made.id);

    await expect(profiles.list('marques')).resolves.toHaveLength(1);
  });

  it('will not remove the last one, which would leave nowhere to record viewing', async () => {
    const profiles = createMemoryProfileService();
    const only = await profiles.ensureDefault('marques', 'Marques');

    await expect(profiles.remove('marques', only.id)).resolves.toBe(false);
  });

  it('says a profile belongs to the account holding it', async () => {
    const profiles = createMemoryProfileService();
    const made = await profiles.create('marques', REQUEST);

    await expect(profiles.belongsTo('marques', made.id)).resolves.toBe(true);
    await expect(profiles.belongsTo('somebody-else', made.id)).resolves.toBe(false);
  });

  it('hands somebody an account of their own without losing the profile', async () => {
    const profiles = createMemoryProfileService();
    const made = await profiles.create('marques', REQUEST);

    await profiles.moveTo(made.id, 'sam');

    await expect(profiles.list('sam')).resolves.toMatchObject([{ id: made.id }]);
    await expect(profiles.list('marques')).resolves.toEqual([]);
  });

  it('draws a face that was chosen rather than storing a picture of one', async () => {
    const profiles = createMemoryProfileService();
    const made = await profiles.create('marques', {
      ...REQUEST,
      avatar: { kind: 'drawn', style: 'bottts', seed: 'abc' },
    });

    const picture = await profiles.readAvatar(made.id);

    expect(picture?.contentType).toBe('image/svg+xml');
  });

  it('has no picture for somebody wearing a letter', async () => {
    const profiles = createMemoryProfileService();
    const made = await profiles.create('marques', REQUEST);

    await expect(profiles.readAvatar(made.id)).resolves.toBeNull();
  });

  it('keeps a photograph that was uploaded, and says the profile wears one', async () => {
    const profiles = createMemoryProfileService();
    const made = await profiles.create('marques', REQUEST);

    await profiles.savePhoto('marques', made.id, {
      body: await aPicture(),
      contentType: 'image/png',
    });

    const [changed] = await profiles.list('marques');

    expect(changed?.avatar).toEqual({ kind: 'photo', isVideo: false, frame: null });
  });

  it('turns away a clip, since a face is a still picture', async () => {
    const profiles = createMemoryProfileService();
    const made = await profiles.create('marques', REQUEST);

    await expect(
      profiles.savePhoto('marques', made.id, {
        body: await aPicture(),
        contentType: 'video/webm',
      }),
    ).resolves.toBe('notAPicture');
  });

  it('turns away a picture with more detail in it than anything will draw', async () => {
    const profiles = createMemoryProfileService();
    const made = await profiles.create('marques', REQUEST);

    await expect(
      profiles.savePhoto('marques', made.id, {
        body: await aPicture(5000, 10),
        contentType: 'image/png',
      }),
    ).resolves.toBe('tooDetailed');
  });

  it('turns away something that says it is a picture and is not', async () => {
    const profiles = createMemoryProfileService();
    const made = await profiles.create('marques', REQUEST);

    await expect(
      profiles.savePhoto('marques', made.id, {
        body: new TextEncoder().encode('not a picture'),
        contentType: 'image/png',
      }),
    ).resolves.toBe('unreadable');
  });

  it('will not let one account put a photograph on a profile held by another', async () => {
    const profiles = createMemoryProfileService();
    const made = await profiles.create('marques', REQUEST);

    await expect(
      profiles.savePhoto('somebody-else', made.id, {
        body: await aPicture(),
        contentType: 'image/png',
      }),
    ).resolves.toBe('notYours');
  });

  it('says everybody who could sign in, across accounts', async () => {
    const profiles = createMemoryProfileService();

    await profiles.create('marques', REQUEST);
    await profiles.create('sam', { name: 'Sam', colour: '#3a8ee8' });

    await expect(profiles.listEveryone()).resolves.toHaveLength(2);
  });

  it('knows the address behind a face, which never leaves the server', async () => {
    const profiles = createMemoryProfileService();
    const made = await profiles.create('marques', REQUEST);

    expect((await profiles.findSignIn(made.id))?.email).toContain('marques');
  });

  it('knows no address for a face that does not exist', async () => {
    const profiles = createMemoryProfileService();

    await expect(profiles.findSignIn('nobody')).resolves.toBeNull();
  });

  it('has nothing to remove for a profile that is not there', async () => {
    const profiles = createMemoryProfileService();

    await profiles.ensureDefault('marques', 'Marques');
    await profiles.create('marques', REQUEST);

    await expect(profiles.remove('marques', '3f2504e0-4f89-41d3-9a0c-0305e82c3301')).resolves.toBe(
      false,
    );
  });

  it('has nowhere to put a photograph for a profile that is not there', async () => {
    const profiles = createMemoryProfileService();

    await expect(
      profiles.savePhoto('marques', '3f2504e0-4f89-41d3-9a0c-0305e82c3301', {
        body: new Uint8Array([1]),
        contentType: 'image/png',
      }),
    ).resolves.toBe('notYours');
  });

  it('has no owner to change for a profile that is not there', async () => {
    const profiles = createMemoryProfileService();

    await expect(profiles.moveTo('3f2504e0-4f89-41d3-9a0c-0305e82c3301', 'somebody')).resolves.toBe(
      false,
    );
  });

  it('offers the household in alphabetical order, not the order they were made', async () => {
    const profiles = createMemoryProfileService();

    await profiles.ensureDefault('user-zoe', 'Zoe');
    await profiles.ensureDefault('user-ada', 'Ada');
    await profiles.ensureDefault('user-milo', 'Milo');

    const everyone = await profiles.listEveryone();

    expect(everyone.map((one) => one.name)).toEqual(['Ada', 'Milo', 'Zoe']);
  });
});

describe('the owner of an account, and its other profiles', () => {
  it('makes the first profile on an account its owner, and nobody after', async () => {
    const profiles = createMemoryProfileService();

    const first = await profiles.ensureDefault('marques', 'Marques');
    const second = await profiles.create('marques', REQUEST);

    expect(first.isOwner).toBe(true);
    expect(second.isOwner).toBe(false);
  });

  it('makes a profile added to an empty account its owner', async () => {
    const profiles = createMemoryProfileService();

    await expect(profiles.create('marques', REQUEST)).resolves.toMatchObject({ isOwner: true });
  });

  it('starts every profile without a PIN and able to ask for things', async () => {
    const profiles = createMemoryProfileService();

    await expect(profiles.create('marques', REQUEST)).resolves.toMatchObject({
      hasPin: false,
      mayRequest: true,
    });
  });

  it('never removes the owner, even with others on the account', async () => {
    const profiles = createMemoryProfileService();
    const owner = await profiles.ensureDefault('marques', 'Marques');

    await profiles.create('marques', REQUEST);

    await expect(profiles.remove('marques', owner.id)).resolves.toBe(false);
    await expect(profiles.list('marques')).resolves.toHaveLength(2);
  });

  it('says where a profile stands', async () => {
    const profiles = createMemoryProfileService();

    await profiles.ensureDefault('marques', 'Marques');

    const made = await profiles.create('marques', REQUEST);

    await expect(profiles.standingOf(made.id)).resolves.toEqual({
      id: made.id,
      userId: 'marques',
      name: 'Sam',
      isOwner: false,
      mayRequest: true,
      pinHash: null,
      pinFailures: 0,
      pinLockedUntil: null,
    });
  });

  it('has no standing for a profile that is not there', async () => {
    await expect(createMemoryProfileService().standingOf('nobody')).resolves.toBeNull();
  });

  it('keeps a PIN, says the profile has one, and starts the count of wrong tries again', async () => {
    const profiles = createMemoryProfileService();
    const made = await profiles.create('marques', REQUEST);

    await profiles.setPinTries(made.id, 5, new Date(60_000));
    await profiles.setPin(made.id, 'scrypt$salt$hash');

    await expect(profiles.standingOf(made.id)).resolves.toMatchObject({
      pinHash: 'scrypt$salt$hash',
      pinFailures: 0,
      pinLockedUntil: null,
    });
    await expect(profiles.list('marques')).resolves.toMatchObject([{ hasPin: true }]);
  });

  it('takes a PIN away', async () => {
    const profiles = createMemoryProfileService();
    const made = await profiles.create('marques', REQUEST);

    await profiles.setPin(made.id, 'scrypt$salt$hash');
    await profiles.setPin(made.id, null);

    await expect(profiles.standingOf(made.id)).resolves.toMatchObject({ pinHash: null });
    await expect(profiles.list('marques')).resolves.toMatchObject([{ hasPin: false }]);
  });

  it('counts wrong tries, and when tries may start again', async () => {
    const profiles = createMemoryProfileService();
    const made = await profiles.create('marques', REQUEST);
    const until = new Date('2026-10-15T12:01:00.000Z');

    await profiles.setPinTries(made.id, 5, until);

    await expect(profiles.standingOf(made.id)).resolves.toMatchObject({
      pinFailures: 5,
      pinLockedUntil: until,
    });
  });

  it('counts a try at a PIN, locking it where told to, and refuses tries while it is locked', async () => {
    const profiles = createMemoryProfileService();
    const made = await profiles.create('marques', REQUEST);
    const at = new Date('2026-10-15T12:00:00.000Z');
    const until = new Date('2026-10-15T12:01:00.000Z');
    const lockOnTheSecond = (failures: number) => (failures === 2 ? until : null);

    await expect(profiles.claimAPinTry(made.id, at, lockOnTheSecond)).resolves.toEqual({
      kind: 'counted',
      failures: 1,
      lockedUntil: null,
    });
    await expect(profiles.claimAPinTry(made.id, at, lockOnTheSecond)).resolves.toEqual({
      kind: 'counted',
      failures: 2,
      lockedUntil: until,
    });
    await expect(profiles.claimAPinTry(made.id, at, lockOnTheSecond)).resolves.toEqual({
      kind: 'locked',
      until,
    });
    await expect(profiles.claimAPinTry('nobody', at, lockOnTheSecond)).resolves.toBeNull();
  });

  it('stops a profile asking for things, and lets it again', async () => {
    const profiles = createMemoryProfileService();
    const made = await profiles.create('marques', REQUEST);

    await profiles.setMayRequest(made.id, false);

    await expect(profiles.list('marques')).resolves.toMatchObject([{ mayRequest: false }]);

    await profiles.setMayRequest(made.id, true);

    await expect(profiles.standingOf(made.id)).resolves.toMatchObject({ mayRequest: true });
  });

  it('changes nothing for a profile that is not there', async () => {
    const profiles = createMemoryProfileService();

    await profiles.setPin('nobody', 'scrypt$salt$hash');
    await profiles.setPinTries('nobody', 1, null);
    await profiles.setMayRequest('nobody', false);

    expect(profiles.state).toEqual([]);
  });

  it('hands the account to another of its profiles, leaving one owner', async () => {
    const profiles = createMemoryProfileService();
    const owner = await profiles.ensureDefault('marques', 'Marques');
    const made = await profiles.create('marques', REQUEST);

    await expect(profiles.handOver('marques', made.id)).resolves.toBe(true);
    await expect(profiles.list('marques')).resolves.toMatchObject([
      { id: made.id, isOwner: true },
      { id: owner.id, isOwner: false },
    ]);
  });

  it('will not hand an account to a profile on another', async () => {
    const profiles = createMemoryProfileService();
    const owner = await profiles.ensureDefault('marques', 'Marques');
    const theirs = await profiles.ensureDefault('somebody-else', 'Them');

    await expect(profiles.handOver('marques', theirs.id)).resolves.toBe(false);
    await expect(profiles.standingOf(owner.id)).resolves.toMatchObject({ isOwner: true });
    await expect(profiles.standingOf(theirs.id)).resolves.toMatchObject({ isOwner: true });
  });

  it('leaves the other accounts’ owners alone when one is handed over', async () => {
    const profiles = createMemoryProfileService();

    await profiles.ensureDefault('marques', 'Marques');

    const made = await profiles.create('marques', REQUEST);
    const theirs = await profiles.ensureDefault('somebody-else', 'Them');

    await profiles.handOver('marques', made.id);

    await expect(profiles.standingOf(theirs.id)).resolves.toMatchObject({ isOwner: true });
  });
});
