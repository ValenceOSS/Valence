import { describe, expect, it, vi } from 'vitest';
import { createPersonScope } from './createPersonScope';

const SAM = { profileId: 'sam', name: 'Sam' };

describe('createPersonScope', () => {
  it('says who a request is for, anywhere inside it, finding them only once', async () => {
    const scope = createPersonScope();
    const find = vi.fn(() => Promise.resolve(SAM));

    await scope.runAs(find, async () => {
      expect(await scope.current()).toEqual(SAM);
      expect(await Promise.resolve().then(() => scope.current())).toEqual(SAM);
    });

    expect(find).toHaveBeenCalledOnce();
  });

  it('finds nobody for a request that never asks who it is for', async () => {
    const scope = createPersonScope();
    const find = vi.fn(() => Promise.resolve(SAM));

    await scope.runAs(find, () => Promise.resolve());

    expect(find).not.toHaveBeenCalled();
  });

  it('says nobody outside a request', async () => {
    expect(await createPersonScope().current()).toBeNull();
  });
});
