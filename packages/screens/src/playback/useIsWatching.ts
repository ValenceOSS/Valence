import { useEffect, useState } from 'react';

const WATCHING = 'data-valence-watching';

/**
 * Whether a film is playing across the whole window, which is what the player marks the document
 * with while it has the screen.
 *
 * Something that would put a dialog in front of somebody asks this first. A question about the
 * application can wait for the credits; a film interrupted to ask it cannot be un-interrupted.
 *
 * @returns Whether a film has the window.
 */
const useIsWatching = (): boolean => {
  const [isWatching, setIsWatching] = useState(() =>
    document.documentElement.hasAttribute(WATCHING),
  );

  useEffect(() => {
    const root = document.documentElement;

    const observer = new MutationObserver(() => {
      setIsWatching(root.hasAttribute(WATCHING));
    });

    observer.observe(root, { attributeFilter: [WATCHING] });
    setIsWatching(root.hasAttribute(WATCHING));

    return () => {
      observer.disconnect();
    };
  }, []);

  return isWatching;
};

export { useIsWatching };
