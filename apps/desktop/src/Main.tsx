import { DialogStackProvider } from '@ValenceClient/dialogs/DialogStackProvider';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@ValenceUI/Toaster';
import { TooltipScope } from '@ValenceUI/TooltipScope';
import { buildQueryClient } from '@ValenceClient/query/queryClient';
import { installDesktopPlatform } from '@ValenceDesktop/platform/installDesktopPlatform';
import { Desktop } from '@ValenceDesktop/Desktop';
import './styles/main.css';

installDesktopPlatform();

const container = document.querySelector('#root');

if (container === null) {
  throw new Error('Root container #root is missing from index.html');
}

const answers = buildQueryClient();

createRoot(container).render(
  <StrictMode>
    <QueryClientProvider client={answers}>
      <DialogStackProvider>
        <TooltipScope>
          <Desktop />
          <Toaster />
        </TooltipScope>
      </DialogStackProvider>
    </QueryClientProvider>
  </StrictMode>,
);
