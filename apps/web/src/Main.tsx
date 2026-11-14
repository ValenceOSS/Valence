import { DialogStackProvider } from '@ValenceClient/dialogs/DialogStackProvider';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';
import { Toaster } from '@ValenceUI/Toaster';
import { reloadWhenCodeIsGone } from '@ValenceUI/reloadWhenCodeIsGone';
import { TooltipScope } from '@ValenceUI/TooltipScope';
import { buildQueryClient } from '@ValenceClient/query/queryClient';
import { installBrowserPlatform } from '@ValenceWeb/platform/installBrowserPlatform';
import { buildRouter } from '@ValenceScreens/routes/buildRouter';
import { KeepTheLayout } from '@ValenceScreens/components/KeepTheLayout/KeepTheLayout';
import { startSpeaking } from '@ValenceClient/language/startSpeaking';
import { fetchLanguagesInUse } from '@ValenceClient/language/fetchLanguagesInUse';
import { directionOf } from '@ValenceI18n/directionOf';
import { loadWords } from 'virtual:valence-words';
import './styles/main.css';

installBrowserPlatform();
reloadWhenCodeIsGone(window);

const LANGUAGE_WAIT_MS = 1500;

await Promise.race([
  fetchLanguagesInUse(),
  new Promise((resolve) => {
    setTimeout(resolve, LANGUAGE_WAIT_MS);
  }),
]);

const spoken = await startSpeaking(navigator.languages, loadWords);

document.documentElement.lang = spoken;
document.documentElement.dir = directionOf(spoken);

const container = document.querySelector('#root');

if (container === null) {
  throw new Error('Root container #root is missing from index.html');
}

const answers = buildQueryClient();

const router = buildRouter();

createRoot(container).render(
  <StrictMode>
    <QueryClientProvider client={answers}>
      <DialogStackProvider>
        <TooltipScope>
          <RouterProvider router={router} />
          <Toaster />
          <KeepTheLayout />
        </TooltipScope>
      </DialogStackProvider>
    </QueryClientProvider>
  </StrictMode>,
);
