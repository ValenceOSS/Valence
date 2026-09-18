import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { forgetPlatform } from '@ValenceClient/platform/installPlatform';
import { installATestClient } from '@ValenceScreens/testing/installATestClient';
import { readPanelPinned, writePanelPinned } from './panelPreference';

const held = new Map<string, string>();

beforeEach(() => {
  held.clear();
  installATestClient({
    store: {
      read: (key) => held.get(key) ?? null,
      write: (key, value) => {
        held.set(key, value);
      },
      forget: (key) => {
        held.delete(key);
      },
    },
  });
});

afterEach(() => {
  forgetPlatform();
});

describe('panelPreference', () => {
  it('leaves the panel loose until somebody pins it', () => {
    expect(readPanelPinned()).toBe(false);
  });

  it('remembers a pinned panel, and a loose one again', () => {
    writePanelPinned(true);

    expect(readPanelPinned()).toBe(true);

    writePanelPinned(false);

    expect(readPanelPinned()).toBe(false);
  });
});
