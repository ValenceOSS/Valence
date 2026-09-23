import { useState } from 'react';
import { X as XIcon } from '@keyline-icons/react';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import { platformInUse } from '@ValenceClient/platform/installPlatform';
import { linkIntoTheApp } from '@ValenceClient/session/linkIntoTheApp';

const PUT_AWAY = 'valence.openInTheApp.putAway';

/**
 * Whether this page is open in a browser on an iPhone, which is the one place the Valence app can be
 * opened from — not an iPad, which it is not made for, and not the desktop application.
 *
 * @returns Whether it is.
 */
const isAnIPhone = (): boolean =>
  platformInUse().thisClientKind() === 'browser' && /iPhone|iPod/u.test(navigator.userAgent);

/**
 * Whether somebody has already put the offer away this visit, read carefully because a private
 * window may refuse the question.
 *
 * @returns Whether it was put away.
 */
const wasPutAway = (): boolean => {
  try {
    return sessionStorage.getItem(PUT_AWAY) === 'yes';
  } catch {
    return false;
  }
};

/**
 * Remembers for the rest of the visit that the offer was put away, where the browser lets it.
 *
 * @returns Whether it could be remembered.
 */
const rememberPutAway = (): boolean => {
  try {
    sessionStorage.setItem(PUT_AWAY, 'yes');

    return true;
  } catch {
    return false;
  }
};

/**
 * Offers to carry on in the Valence app, on an iPhone browsing the web application: signing in the
 * television whose code was scanned, where that is what the page is for, and otherwise simply the
 * app. Offered on every page, signed in or not, since somebody who has just scanned a television's
 * code with the camera is often looking at the way in rather than the approval.
 *
 * It says it is for somebody who has the app, because a page cannot see which apps a phone holds,
 * and it can be put away for the rest of the visit.
 */
const OpenInTheApp = () => {
  const [isPutAway, setIsPutAway] = useState(wasPutAway);

  if (isPutAway || !isAnIPhone()) {
    return null;
  }

  return (
    <aside
      aria-label="Open in the Valence app"
      className="fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+0.75rem)] z-50 flex items-center gap-3 rounded-xl bg-surface-raised p-3 pl-4 shadow-lg ring-1 ring-line"
    >
      <p className="min-w-0 flex-1 text-sm text-text">Have the Valence app?</p>

      <Button
        variant="glossy"
        size="sm"
        onClick={() => {
          window.location.href = linkIntoTheApp(
            {
              televisionCode:
                window.location.pathname === '/device'
                  ? new URLSearchParams(window.location.search).get('user_code')
                  : null,
            },
            window.location.origin,
          );
        }}
      >
        Open in the app
      </Button>

      <Button
        isIconOnly
        variant="ghost"
        size="sm"
        label="Not now"
        onClick={() => {
          rememberPutAway();
          setIsPutAway(true);
        }}
      >
        <Icon of={XIcon} size={16} />
      </Button>
    </aside>
  );
};

OpenInTheApp.displayName = 'OpenInTheApp';

export { OpenInTheApp };
