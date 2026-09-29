import { useCallback, useMemo, useRef, useState } from 'react';
import { askToConfirmOnTv } from '@ValenceTv/plugins/askToConfirmOnTv';
import { onTheServer } from '@ValenceTv/platform/theServersOrigin';
import type { PluginSurfaceHost } from '@ValenceClient/plugins/usePluginSurface';

/**
 * How a plugin page on the television opens a page of the server, such as the sign-in page of an
 * account being connected: a television has no browser, so the page is shown as a code to scan,
 * and finishing on the phone needs no session there because the address carries a one-time ticket.
 * The plugin page waits until somebody says they are done, then reads itself again.
 *
 * @returns The host to hand the plugin page, the address being shown, and a way to put it away.
 */
const useScanToOpen = (): { host: PluginSurfaceHost; address: string | null; done: () => void } => {
  const [address, setAddress] = useState<string | null>(null);
  const finish = useRef<(() => void) | null>(null);

  const host = useMemo<PluginSurfaceHost>(
    () => ({
      askToConfirm: askToConfirmOnTv,
      openOnServer: (path) =>
        new Promise<void>((settle) => {
          if (!path.startsWith('/') || path.startsWith('//')) {
            settle();

            return;
          }

          finish.current = settle;
          setAddress(onTheServer(path));
        }),
    }),
    [],
  );

  const done = useCallback(() => {
    finish.current?.();
    finish.current = null;
    setAddress(null);
  }, []);

  return { host, address, done };
};

export { useScanToOpen };
