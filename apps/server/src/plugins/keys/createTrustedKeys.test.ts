import { generateKeyPairSync } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';
import { createTrustedKeys } from './createTrustedKeys';
import type { TrustedKey } from '@ValenceContracts/schemas/Plugin';

const aKey = () =>
  generateKeyPairSync('ed25519').publicKey.export({ type: 'spki', format: 'pem' }).toString();

const OFFICIAL = { 'valence-official-2026': aKey() };

const settingsHolding = (pluginTrustedKeys: TrustedKey[]) => {
  let kept = pluginTrustedKeys;

  return {
    read: () => Promise.resolve({ pluginTrustedKeys: kept }),
    write: vi.fn((patch: { pluginTrustedKeys: TrustedKey[] }) => {
      kept = patch.pluginTrustedKeys;

      return Promise.resolve({ pluginTrustedKeys: kept });
    }),
  };
};

describe('createTrustedKeys', () => {
  it('trusts the keys the variable names and the ones saved, but never under an official id', async () => {
    const lab = aKey();
    const saved = aKey();
    const log = vi.fn();
    const keys = createTrustedKeys({
      official: OFFICIAL,
      variable: `home-lab=${lab.split('\n')[1] ?? ''},valence-official-2026=${OFFICIAL['valence-official-2026'].split('\n')[1] ?? ''}`,
      settings: settingsHolding([
        { id: 'friends', publicKey: saved },
        { id: 'valence-official-2026', publicKey: saved },
      ]),
      log,
    });

    expect(await keys.all()).toEqual({ 'home-lab': lab, friends: saved });
    expect((await keys.list()).map((key) => [key.id, key.isFromVariable])).toEqual([
      ['home-lab', true],
      ['friends', false],
    ]);
    expect(log).toHaveBeenCalledWith(expect.stringContaining('valence-official-2026'));
  });

  it('saves keys pasted as a whole file or a line, refusing what it should not keep', async () => {
    const settings = settingsHolding([]);
    const keys = createTrustedKeys({
      official: OFFICIAL,
      variable: `home-lab=${aKey().split('\n')[1] ?? ''}`,
      settings,
      log: () => undefined,
    });
    const pasted = aKey();

    expect(await keys.save([{ id: 'friends', publicKey: pasted.split('\n')[1] ?? '' }])).toEqual({
      keys: [
        expect.objectContaining({ id: 'home-lab', isFromVariable: true }),
        { id: 'friends', publicKey: pasted, isFromVariable: false },
      ],
    });

    const problemOf = async (asked: Parameters<typeof keys.save>[0]) => {
      const answer = await keys.save(asked);

      return 'problem' in answer ? answer.problem.code : null;
    };

    expect(await problemOf([{ id: 'valence-official-2026', publicKey: pasted }])).toBe(
      'server.keys.trustedKeys.idIsOneOfValencesOwn',
    );
    expect(await problemOf([{ id: 'home-lab', publicKey: pasted }])).toBe(
      'server.keys.trustedKeys.idIsAlreadySetBy',
    );
    expect(
      await problemOf([
        { id: 'twice', publicKey: pasted },
        { id: 'twice', publicKey: pasted },
      ]),
    ).toBe('server.keys.trustedKeys.idIsListedTwice');
    expect(await problemOf([{ id: 'broken', publicKey: 'AAAA' }])).toBe(
      'server.keys.trustedKeys.idIsNotAnEd25519',
    );
    expect(settings.write).toHaveBeenCalledTimes(1);
  });
});
