import { afterEach, describe, expect, it, vi } from 'vitest';
import { askForADifferentServer, isTheDesktopClient } from './theDesktopShell';
import type * as Auth from '@ValenceClient/session/auth';

const signOut = vi.hoisted(() => vi.fn());

vi.mock('@ValenceClient/session/auth', async (importOriginal) => ({
  ...(await importOriginal<typeof Auth>()),
  signOut,
}));

const insideTheWindow = (): void => {
  document.documentElement.dataset['valenceDesktop'] = 'true';
};

afterEach(() => {
  delete document.documentElement.dataset['valenceDesktop'];
  signOut.mockReset();
});

describe('isTheDesktopClient', () => {
  it('says no in a browser, which puts no mark on the document', () => {
    expect(isTheDesktopClient()).toBe(false);
  });

  it('says yes where the window marked the document before the page ran', () => {
    insideTheWindow();

    expect(isTheDesktopClient()).toBe(true);
  });

  it('says no for a mark that says anything else, rather than for merely being present', () => {
    document.documentElement.dataset['valenceDesktop'] = 'maybe';

    expect(isTheDesktopClient()).toBe(false);
  });
});

describe('askForADifferentServer', () => {
  it('asks the window, which is the only thing that can point itself somewhere else', async () => {
    signOut.mockResolvedValue(true);

    const heard = vi.fn();
    document.addEventListener('valence:change-server', heard);

    await askForADifferentServer();

    expect(heard).toHaveBeenCalledOnce();

    document.removeEventListener('valence:change-server', heard);
  });

  it('signs out of the server being left, before asking the window to move', async () => {
    const order: string[] = [];

    signOut.mockImplementation(() => {
      order.push('signed out');

      return Promise.resolve(true);
    });

    const heard = () => {
      order.push('window asked');
    };

    document.addEventListener('valence:change-server', heard);

    await askForADifferentServer();

    document.removeEventListener('valence:change-server', heard);

    expect(order).toEqual(['signed out', 'window asked']);
  });

  it('asks the window to move even where signing out did not reach the server', async () => {
    signOut.mockResolvedValue(false);

    const heard = vi.fn();
    document.addEventListener('valence:change-server', heard);

    await askForADifferentServer();

    expect(heard).toHaveBeenCalledOnce();

    document.removeEventListener('valence:change-server', heard);
  });
});
