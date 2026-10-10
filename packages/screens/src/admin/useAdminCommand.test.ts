import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { requestAdminCommand } from './pendingAdminCommand';
import { useAdminCommand } from './useAdminCommand';

describe('useAdminCommand', () => {
  it('carries out an action asked for before its page opened, as the page opens', () => {
    const run = vi.fn();

    requestAdminCommand('createRole');
    renderHook(() => {
      useAdminCommand('createRole', run);
    });

    expect(run).toHaveBeenCalledOnce();
  });

  it('carries out an action asked for while its page is showing, and no other', () => {
    const run = vi.fn();

    renderHook(() => {
      useAdminCommand('createWebhook', run);
    });

    act(() => {
      requestAdminCommand('addLibrary');
    });

    expect(run).not.toHaveBeenCalled();

    act(() => {
      requestAdminCommand('createWebhook');
    });

    expect(run).toHaveBeenCalledOnce();
  });
});
