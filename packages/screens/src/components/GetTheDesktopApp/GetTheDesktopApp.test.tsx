import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { GetTheDesktopApp } from './GetTheDesktopApp';

const A_MAC =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Safari/605.1.15';

const AN_IPHONE =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1';

/**
 * Draws the offer.
 *
 * @param waitsMs - How long it waits before arriving.
 * @returns What was drawn.
 */
const drawIt = (waitsMs: number) => render(<GetTheDesktopApp waitsMs={waitsMs} />);

/**
 * Lets everything already due on the page happen.
 */
const settle = async (): Promise<void> => {
  await new Promise((done) => {
    setTimeout(done, 0);
  });
};

beforeEach(() => {
  installPlatform(aFakePlatform({ thisClientKind: () => 'browser' }));
  vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(A_MAC);
  localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('GetTheDesktopApp', () => {
  it('offers the app for the computer the page is open on once it has waited', async () => {
    drawIt(0);

    expect(await screen.findByText('Valence for Mac')).toBeInTheDocument();
  });

  it('waits before arriving', async () => {
    drawIt(60_000);

    await settle();

    expect(screen.queryByText('Valence for Mac')).not.toBeInTheDocument();
  });

  it('opens the download page and stays until it is put away', async () => {
    const open = vi.fn();
    const user = userEvent.setup();

    vi.stubGlobal('open', open);
    drawIt(0);

    await user.click(await screen.findByRole('button', { name: 'Get it' }));

    expect(open).toHaveBeenCalledWith(
      'https://getvalence.app/downloads',
      '_blank',
      'noopener,noreferrer',
    );
    expect(screen.getByText('Valence for Mac')).toBeInTheDocument();
    expect(localStorage.getItem('valence.getTheDesktopApp.putAway')).toBeNull();
  });

  it('stays away on this browser once put away', async () => {
    const user = userEvent.setup();
    const { unmount } = drawIt(0);

    await user.click(await screen.findByRole('button', { name: 'Not now' }));

    expect(localStorage.getItem('valence.getTheDesktopApp.putAway')).toBe('yes');

    unmount();
    drawIt(0);
    await settle();

    expect(screen.queryByText('Valence for Mac')).not.toBeInTheDocument();
  });

  it('offers nothing on a phone', async () => {
    vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(AN_IPHONE);

    drawIt(0);
    await settle();

    expect(screen.queryByRole('button', { name: 'Get it' })).not.toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(GetTheDesktopApp.displayName).toBe('GetTheDesktopApp');
  });
});
