import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { BrowserWindow } from 'electron';

const { openExternal, focusTheApp, listenForTheHandBack } = vi.hoisted(() => ({
  openExternal: vi.fn<(url: string) => Promise<void>>(),
  focusTheApp: vi.fn<(options: { steal: boolean }) => void>(),
  listenForTheHandBack:
    vi.fn<() => Promise<{ port: number; handedBack: Promise<string | null> }>>(),
}));

vi.mock('electron', () => ({ app: { focus: focusTheApp }, shell: { openExternal } }));

vi.mock('@ValenceDesktop/main/listenForTheHandBack', () => ({ listenForTheHandBack }));

vi.mock('@ValenceDesktop/main/theServerAddress', () => ({
  theServerAddress: () => 'https://valence.example',
}));

const { signInOnAPage } = await import('./signInOnAPage');

const CHALLENGE = 'a'.repeat(64);

const show = vi.fn();

const focus = vi.fn();

const WINDOW: Pick<BrowserWindow, 'isDestroyed' | 'show' | 'focus'> = {
  isDestroyed: () => false,
  show,
  focus,
};

beforeEach(() => {
  openExternal.mockReset().mockResolvedValue();
  focusTheApp.mockReset();
  listenForTheHandBack.mockReset();
  show.mockReset();
  focus.mockReset();
});

describe('signInOnAPage', () => {
  it('opens the page in the browser, naming the port and the face, and takes the code back', async () => {
    listenForTheHandBack.mockResolvedValue({ port: 51_234, handedBack: Promise.resolve('abc') });

    await expect(signInOnAPage(WINDOW, CHALLENGE, 'profile-1')).resolves.toEqual({
      kind: 'done',
      done: 'abc',
    });

    expect(openExternal).toHaveBeenCalledWith(
      `https://valence.example/phone-sign-in?challenge=${CHALLENGE}&profile=profile-1&port=51234`,
    );
  });

  it('brings the app back to the front once the browser hands it back', async () => {
    listenForTheHandBack.mockResolvedValue({ port: 51_234, handedBack: Promise.resolve('abc') });

    await signInOnAPage(WINDOW, CHALLENGE, null);

    expect(focus).toHaveBeenCalled();
    expect(focusTheApp).toHaveBeenCalledWith({ steal: true });
  });

  it('reads a browser that never came back as a cancellation, and leaves the app where it is', async () => {
    listenForTheHandBack.mockResolvedValue({ port: 51_234, handedBack: Promise.resolve(null) });

    await expect(signInOnAPage(WINDOW, CHALLENGE, null)).resolves.toEqual({ kind: 'cancelled' });
    expect(focusTheApp).not.toHaveBeenCalled();
  });
});
