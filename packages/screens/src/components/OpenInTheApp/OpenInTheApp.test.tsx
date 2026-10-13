import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import { OpenInTheApp } from './OpenInTheApp';

const AN_IPHONE =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1';

beforeEach(() => {
  installPlatform(aFakePlatform({ thisClientKind: () => 'browser' }));
  vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(AN_IPHONE);
  sessionStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
  document.head.querySelector('meta[name="apple-itunes-app"]')?.remove();
});

/**
 * Gives the page the App Store banner's tag, as the server does where a listing is set.
 */
const withTheBanner = () => {
  const tag = document.createElement('meta');

  tag.name = 'apple-itunes-app';
  tag.content = 'app-id=6815748526, app-argument=valence://open';
  document.head.append(tag);
};

describe('OpenInTheApp', () => {
  it('offers the app on an iPhone', async () => {
    renderInAnAddress(<OpenInTheApp />);

    expect(await screen.findByRole('button', { name: 'Open in the app' })).toBeInTheDocument();
  });

  it('leaves Safari to its own App Store banner where the server gives it one', async () => {
    withTheBanner();
    renderInAnAddress(<OpenInTheApp />);

    await new Promise((settle) => {
      setTimeout(settle, 0);
    });

    expect(screen.queryByRole('button', { name: 'Open in the app' })).not.toBeInTheDocument();
  });

  it('still offers the app in another iPhone browser, which shows no banner', async () => {
    withTheBanner();
    vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(
      'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/140.0.0.0 Mobile/15E148 Safari/604.1',
    );
    renderInAnAddress(<OpenInTheApp />);

    expect(await screen.findByRole('button', { name: 'Open in the app' })).toBeInTheDocument();
  });

  it('offers nothing on anything that is not an iPhone', async () => {
    vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue('Mozilla/5.0 (Macintosh)');

    renderInAnAddress(<OpenInTheApp />);

    await new Promise((settle) => {
      setTimeout(settle, 0);
    });

    expect(screen.queryByRole('button', { name: 'Open in the app' })).not.toBeInTheDocument();
  });

  it('offers nothing on the page the app itself opened to be signed in through', async () => {
    window.history.replaceState(null, '', '/phone-sign-in?challenge=abc');

    renderInAnAddress(<OpenInTheApp />);

    await new Promise((settle) => {
      setTimeout(settle, 0);
    });

    expect(screen.queryByRole('button', { name: 'Open in the app' })).not.toBeInTheDocument();

    window.history.replaceState(null, '', '/');
  });

  it('offers nothing inside the desktop application', async () => {
    installPlatform(aFakePlatform({ thisClientKind: () => 'desktop' }));

    renderInAnAddress(<OpenInTheApp />);

    await new Promise((settle) => {
      setTimeout(settle, 0);
    });

    expect(screen.queryByRole('button', { name: 'Open in the app' })).not.toBeInTheDocument();
  });

  it('puts itself away for the rest of the visit', async () => {
    renderInAnAddress(<OpenInTheApp />);

    await userEvent.click(await screen.findByRole('button', { name: 'Not now' }));

    expect(screen.queryByRole('button', { name: 'Open in the app' })).not.toBeInTheDocument();
    expect(sessionStorage.getItem('valence.openInTheApp.putAway')).toBe('yes');
  });

  it('sets a display name so devtools can identify it', () => {
    expect(OpenInTheApp.displayName).toBe('OpenInTheApp');
  });
});
