import { act, renderHook } from '@testing-library/react';
import { onlineManager } from '@tanstack/react-query';
import { afterEach, describe, expect, it } from 'vitest';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { forgetPlatform, installPlatform } from '@ValenceClient/platform/installPlatform';
import { chooseOffline } from '@ValenceClient/offline/chosenOffline';
import { useQueriesHeldOffline } from './useQueriesHeldOffline';

afterEach(() => {
  onlineManager.setOnline(true);
  forgetPlatform();
});

describe('useQueriesHeldOffline', () => {
  it('lets queries run while the client is online', () => {
    installPlatform(aFakePlatform({ canKeepFiles: () => true }));

    renderHook(() => {
      useQueriesHeldOffline();
    });

    expect(onlineManager.isOnline()).toBe(true);
  });

  it('holds them once somebody goes offline, and lets them go on coming back', () => {
    installPlatform(aFakePlatform({ canKeepFiles: () => true }));

    renderHook(() => {
      useQueriesHeldOffline();
    });

    act(() => {
      chooseOffline(true);
    });

    expect(onlineManager.isOnline()).toBe(false);

    act(() => {
      chooseOffline(false);
    });

    expect(onlineManager.isOnline()).toBe(true);
  });

  it('keeps holding them when the network says it is back', () => {
    installPlatform(aFakePlatform({ canKeepFiles: () => true }));

    renderHook(() => {
      useQueriesHeldOffline();
    });

    act(() => {
      chooseOffline(true);
      onlineManager.setOnline(true);
    });

    expect(onlineManager.isOnline()).toBe(false);
  });

  it('leaves a client that keeps nothing to its network', () => {
    installPlatform(aFakePlatform({ canKeepFiles: () => false }));

    renderHook(() => {
      useQueriesHeldOffline();
    });

    act(() => {
      chooseOffline(true);
    });

    expect(onlineManager.isOnline()).toBe(true);
  });
});
