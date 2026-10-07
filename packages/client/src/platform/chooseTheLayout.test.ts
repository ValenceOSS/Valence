import { describe, expect, it, vi } from 'vitest';
import { chooseTheLayout } from '@ValenceClient/platform/chooseTheLayout';

describe('chooseTheLayout', () => {
  it('keeps the choice for the whole server, for a year, and shows it at once', () => {
    const page = { cookie: '', location: { reload: vi.fn() } };

    chooseTheLayout('web', page);

    expect(page.cookie).toBe('valence-layout=web; path=/; max-age=31536000; samesite=lax');
    expect(page.location.reload).toHaveBeenCalledOnce();
  });
});
